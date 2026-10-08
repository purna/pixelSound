/* Local audio-only WebM conversion. No uploads or microphone access. */
(() => {
    'use strict';
    const el = id => document.getElementById(id);
    const modal = el('converterModal');
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const mimeType = window.MediaRecorder && ['audio/webm;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
    const supported = Boolean(AudioContextClass && mimeType);
    let queue = [], busy = false, cancelled = false, stopCurrent = null, packaging = false;
    const status = message => { el('converterStatus').textContent = message; };
    function controls() {
        el('convertAudio').disabled = busy || !supported || !queue.some(item => !item.url);
        el('clearConverter').disabled = busy || !queue.length;
        el('chooseConverterFiles').disabled = busy || !supported;
        el('converterFiles').disabled = busy || !supported;
        el('converterBitrate').disabled = busy;
        el('cancelConversion').hidden = !busy;
        el('downloadAllConverter').disabled = busy || packaging || !queue.some(item => item.blob);
        if (packaging) {
            el('clearConverter').disabled = true;
            el('convertAudio').disabled = true;
            el('chooseConverterFiles').disabled = true;
            el('converterFiles').disabled = true;
        }
    }
    function addFiles(files) {
        if (busy || packaging || !supported) return;
        const messages = [];
        for (const file of files) {
            if (queue.length >= 10) { messages.push('The queue is limited to 10 files.'); break; }
            if (!file.size || file.size > 100 * 1024 * 1024) { messages.push(`${file.name}: choose a non-empty file under 100 MB.`); continue; }
            if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|oga|opus|m4a|aac|flac|webm)$/i.test(file.name)) { messages.push(`${file.name}: choose an audio file.`); continue; }
            const row = document.createElement('li');
            const name = document.createElement('strong'); name.textContent = file.name;
            const detail = document.createElement('small'); detail.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready`;
            const progress = document.createElement('progress'); progress.max = 100; progress.value = 0; progress.hidden = true; progress.setAttribute('aria-label', `Conversion progress for ${file.name}`);
            row.append(name, detail, progress); el('converterQueue').append(row);
            queue.push({ file, row, detail, progress, url: null });
        }
        el('converterFiles').value = '';
        status(messages.length ? messages.join(' ') : `${queue.length} file(s) ready to convert.`);
        controls();
    }
    async function convert(item) {
        const context = new AudioContextClass();
        let source, destination, recorder, timer;
        try {
            // Resume during the click gesture before reading/decoding the file.
            await context.resume();
            item.detail.textContent = 'Reading audio…';
            const buffer = await window.decodeConverterAudio(context, item.file);
            if (cancelled) throw new Error('Conversion cancelled.');
            source = context.createBufferSource(); source.buffer = buffer;
            destination = context.createMediaStreamDestination(); source.connect(destination);
            recorder = new MediaRecorder(destination.stream, { mimeType, audioBitsPerSecond: Number(el('converterBitrate').value) });
            const chunks = [];
            item.progress.hidden = false;
            await new Promise((resolve, reject) => {
                let settled = false;
                const fail = error => { if (!settled) { settled = true; reject(error); } };
                recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
                recorder.onerror = () => fail(new Error('Encoding failed. Please try again.'));
                recorder.onstop = () => { if (!settled) { settled = true; resolve(); } };
                source.onended = () => { if (recorder.state !== 'inactive') recorder.stop(); };
                stopCurrent = () => {
                    fail(new Error('Conversion cancelled.'));
                    source.onended = null;
                    source.stop();
                    if (recorder.state !== 'inactive') recorder.stop();
                };
                recorder.start(250);
                const start = context.currentTime;
                source.start();
                timer = setInterval(() => {
                    const percent = Math.min(99, Math.floor((context.currentTime - start) / buffer.duration * 100));
                    item.progress.value = percent;
                    item.detail.textContent = `Converting… ${percent}%`;
                }, 200);
            });
            if (cancelled) throw new Error('Conversion cancelled.');
            const blob = new Blob(chunks, { type: mimeType });
            if (!blob.size) throw new Error('No audio was encoded. Please try again.');
            item.blob = blob;
            item.url = URL.createObjectURL(blob);
            item.progress.value = 100;
            item.progress.hidden = true;
            item.detail.textContent = `Complete · ${(blob.size / 1024 / 1024).toFixed(2)} MB · WebM`;
            const preview = document.createElement('audio'); preview.controls = true; preview.preload = 'metadata'; preview.src = item.url;
            const download = document.createElement('a'); download.className = 'btn'; download.textContent = 'Download WebM'; download.href = item.url; download.download = item.file.name.replace(/\.[^.]+$/, '') + '.webm';
            item.row.append(preview, download);
        } catch (error) {
            item.progress.hidden = true;
            item.detail.textContent = cancelled ? 'Cancelled · Ready to retry' : `Failed: ${error.message || 'This audio format could not be decoded.'}`;
        } finally {
            clearInterval(timer); stopCurrent = null;
            if (source) { source.onended = null; try { source.stop(); } catch (_) { /* Already ended. */ } source.disconnect(); }
            if (recorder && recorder.state !== 'inactive') recorder.stop();
            if (destination) destination.stream.getTracks().forEach(track => track.stop());
            await context.close();
        }
    }
    el('convertAudio').addEventListener('click', async () => {
        if (busy || packaging || !supported) return;
        busy = true; cancelled = false; controls();
        status('Converting locally. Keep this tab open.');
        try {
            for (const item of queue) { if (cancelled) break; if (!item.url) await convert(item); }
            const done = queue.filter(item => item.url).length;
            status(cancelled ? 'Conversion cancelled. Completed downloads are still available.' : `${done} of ${queue.length} files converted. Download your WebM files below.${done < queue.length ? ' You can retry failed files.' : ''}`);
        } catch (error) { status(`Conversion failed: ${error.message}`); }
        finally { busy = false; controls(); }
    });
    el('downloadAllConverter').addEventListener('click', async () => {
        if (busy || packaging) return;
        const completed = queue.filter(item => item.blob);
        if (!completed.length) return;
        packaging = true; controls(); status('Preparing your ZIP download…');
        try {
            const zip = await window.createWebmZip(completed.map(item => ({ name: item.file.name, blob: item.blob })));
            const url = URL.createObjectURL(zip);
            const link = document.createElement('a');
            link.href = url; link.download = 'pixel-sound-webm.zip';
            document.body.append(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
            status(`ZIP ready with ${completed.length} converted file(s).`);
        } catch (error) { status(`Could not create the ZIP: ${error.message}. Individual downloads are still available.`); }
        finally { packaging = false; controls(); }
    });
    el('cancelConversion').addEventListener('click', () => { cancelled = true; if (stopCurrent) stopCurrent(); status('Cancelling conversion…'); });
    el('clearConverter').addEventListener('click', () => {
        if (busy || packaging) return;
        queue.forEach(item => { const audio = item.row.querySelector('audio'); if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); } if (item.url) URL.revokeObjectURL(item.url); });
        queue = []; el('converterQueue').replaceChildren(); status('Choose files to get started.'); controls();
    });
    el('chooseConverterFiles').addEventListener('click', () => el('converterFiles').click());
    el('converterFiles').addEventListener('change', event => addFiles(event.target.files));
    const dropZone = el('converterDropZone');
    ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); if (!busy) dropZone.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('drag-over'); }));
    dropZone.addEventListener('drop', event => addFiles(event.dataTransfer.files));
    function close() {
        modal.classList.add('hidden');
        modal.querySelectorAll('audio').forEach(audio => audio.pause());
        document.body.style.overflow = previousOverflow;
        el('openConverter').focus();
    }
    let previousOverflow = '';
    el('openConverter').addEventListener('click', () => {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        modal.classList.remove('hidden'); el('closeConverter').focus();
    });
    el('closeConverter').addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.stopPropagation(); close(); }
        if (event.key === 'Tab') {
            const focusable = [...modal.querySelectorAll('button, select, a[href], audio[controls]')].filter(node => !node.disabled && !node.hidden);
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
    if (!supported) status('This browser cannot encode WebM audio. Open this tool in a current Chrome, Edge, or Firefox browser.');
    controls();
})();

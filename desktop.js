(() => {
    const mq =
        "(min-width: 1280px) and (pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)";

    const start = () => {
        if (window.extraSiteContent.running) return;
        window.extraSiteContent.running = true;

        const media = matchMedia(mq);
        let canvas;
        let ctx;
        let points = [];
        let w = 0;
        let h = 0;
        let t = 0;
        let last = 0;
        let raf = 0;
        let mx = 0;
        let my = 0;
        let hovering = false;

        // match layout.css tokens
        const title = "hsl(152, 60%, 28%)";
        const accent = "hsl(270, 60%, 85%)";

        const seed = () => {
            const gap = 28;
            points = [];
            for (let y = 0; y <= h; y += gap) {
                for (let x = 0; x <= w; x += gap) {
                    points.push({ x, y, phase: (x + y) * 0.01 });
                }
            }
        };

        const resize = () => {
            if (!canvas) return;
            const dpr = Math.min(devicePixelRatio || 1, 2);
            w = innerWidth;
            h = innerHeight;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed();
        };

        const draw = (now) => {
            const dt = last ? Math.min(now - last, 48) : 16;
            last = now;
            t += dt * 0.001;

            ctx.clearRect(0, 0, w, h);

            const cx = hovering ? mx : w * 0.72;
            const cy = hovering ? my : h * 0.28;
            const radius = hovering ? 240 : 180;

            for (const p of points) {
                const d = Math.hypot(p.x - cx, p.y - cy);
                const wave = Math.sin(t * 0.7 + p.phase) * 0.5 + 0.5;
                const fall = Math.max(0, 1 - d / radius) ** 2;
                const size = 1.1 + fall * 2.4 + wave * 0.35;

                ctx.beginPath();
                ctx.fillStyle = fall > 0.04 ? accent : title;
                ctx.globalAlpha = 0.08 + fall * 0.45 + wave * 0.05;
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            raf = requestAnimationFrame(draw);
        };

        const onMove = (e) => {
            mx = e.clientX;
            my = e.clientY;
            hovering = true;
        };

        const onLeave = () => {
            hovering = false;
        };

        const onVisibility = () => {
            if (document.hidden) {
                cancelAnimationFrame(raf);
            } else if (canvas) {
                last = 0;
                raf = requestAnimationFrame(draw);
            }
        };

        const mount = () => {
            canvas = document.createElement("canvas");
            canvas.className = "desktop-bg";
            canvas.setAttribute("aria-hidden", "true");
            ctx = canvas.getContext("2d");
            document.body.prepend(canvas);
            resize();
            addEventListener("pointermove", onMove, { passive: true });
            document.documentElement.addEventListener("mouseleave", onLeave);
            addEventListener("resize", resize);
            document.addEventListener("visibilitychange", onVisibility);
            raf = requestAnimationFrame(draw);
        };

        const unmount = () => {
            cancelAnimationFrame(raf);
            removeEventListener("pointermove", onMove);
            document.documentElement.removeEventListener("mouseleave", onLeave);
            removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVisibility);
            canvas.remove();
            canvas = null;
            ctx = null;
        };

        const sync = () => {
            if (media.matches && !canvas) mount();
            else if (!media.matches && canvas) unmount();
        };

        media.addEventListener("change", sync);
        addEventListener("resize", sync);
        sync();
    };

    window.extraSiteContent = { start, running: false };
})();

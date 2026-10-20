import './bootstrap';
import StandaloneAlpine from 'alpinejs';
import { Livewire, Alpine as LivewireAlpine } from '../../vendor/livewire/livewire/dist/livewire.esm';
const isStaffWorkspace = document.body.classList.contains('staff-workspace');
const Alpine = isStaffWorkspace ? LivewireAlpine : StandaloneAlpine;
import { initializeStaffWorkspace } from './staff-workspace';

window.Alpine = Alpine;

const REVEAL_SELECTOR = [
    '[data-reveal]',
    '.panel',
    '.panel-soft',
    '.panel-hero',
    '.metric-card',
    '.chart-shell',
    '.table-wrap',
    '.filter-panel',
    '.empty-state',
    '.modal-shell',
].join(',');

const STAGGER_CONTAINER_SELECTOR = '[data-stagger]';
const CHART_MOBILE_BREAKPOINT = '(max-width: 900px)';

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function prefersCompactAnimation() {
    return window.matchMedia(CHART_MOBILE_BREAKPOINT).matches;
}

function applyStagger(container) {
    const children = Array.from(container.children).filter((child) => child instanceof HTMLElement);
    children.forEach((child, index) => {
        if (child.dataset.noReveal === 'true') {
            return;
        }

        if (!child.classList.contains('motion-reveal')) {
            child.classList.add('motion-reveal');
        }

        if (prefersReducedMotion()) {
            child.style.removeProperty('--reveal-delay');
            return;
        }

        const delay = Math.min(index * 48, 320);
        child.style.setProperty('--reveal-delay', `${delay}ms`);
    });
}

function markRevealTargets(root = document) {
    root.querySelectorAll(REVEAL_SELECTOR).forEach((target) => {
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (target.dataset.noReveal === 'true') {
            return;
        }

        target.classList.add('motion-reveal');
    });

    root.querySelectorAll(STAGGER_CONTAINER_SELECTOR).forEach((container) => {
        if (!(container instanceof HTMLElement)) {
            return;
        }
        applyStagger(container);
    });
}

function revealImmediately(root = document) {
    root.querySelectorAll('.motion-reveal').forEach((el) => {
        el.classList.add('is-visible');
    });
}

function initReveal(root = document) {
    markRevealTargets(root);

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
        revealImmediately(root);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.16,
    });

    root.querySelectorAll('.motion-reveal:not(.is-visible)').forEach((el) => {
        observer.observe(el);
    });
}

function initHeaderDepth() {
    const header = document.querySelector('.app-header');
    if (!(header instanceof HTMLElement)) {
        return;
    }

    if (header.dataset.depthBound === 'true') {
        return;
    }

    header.dataset.depthBound = 'true';

    const onScroll = () => {
        if (window.scrollY > 10) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

function buildChart(canvas, config) {
    if (!(canvas instanceof HTMLCanvasElement) || !window.Chart) {
        return null;
    }

    const parent = canvas.parentElement;
    if (parent instanceof HTMLElement) {
        parent.style.width = '100%';
        parent.style.maxWidth = '100%';
        parent.style.overflowX = 'hidden';
    }

    const baseHeight = Number.parseInt(
        canvas.dataset.baseHeight ?? canvas.getAttribute('height') ?? '180',
        10,
    ) || 180;
    canvas.dataset.baseHeight = `${baseHeight}`;

    const existingChart = window.Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    // Reset any previously inflated inline size before creating a fresh chart instance.
    canvas.removeAttribute('style');
    canvas.setAttribute('height', `${baseHeight}`);
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.maxWidth = '100%';

    if (parent instanceof HTMLElement && parent.clientWidth > 0) {
        canvas.width = parent.clientWidth;
    }

    config.options ??= {};
    config.options.responsive ??= true;
    config.options.maintainAspectRatio ??= !prefersCompactAnimation();
    config.options.animation ??= false;
    config.options.animations ??= false;
    config.options.events ??= [];
    config.options.transitions ??= {
        active: { animation: { duration: 0 } },
        resize: { animation: { duration: 0 } },
    };

    if (prefersCompactAnimation()) {
        config.options.aspectRatio ??= 1.1;
    }

    if (config.options.plugins?.legend?.labels) {
        config.options.plugins.legend.labels.color ??= '#475569';
    }

    // Prevent awkward vertical spike animation when a line chart has only one point.
    if (config.type === 'line') {
        const labels = config.data?.labels ?? [];
        const hasSinglePoint = Array.isArray(labels) && labels.length <= 1;
        if (hasSinglePoint && Array.isArray(config.data?.datasets)) {
            config.data.datasets = config.data.datasets.map((dataset) => ({
                ...dataset,
                fill: false,
                tension: 0,
                pointRadius: dataset.pointRadius ?? 4,
            }));
        }
    }

    if (document.body.classList.contains('staff-workspace')) {
        config.options.events = ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'];
        canvas.setAttribute('role', 'img');
        const title = canvas.closest('article')?.querySelector('h2,h3')?.textContent.trim() || 'Performance chart';
        canvas.setAttribute('aria-label', `${title}. Use the data table below for exact values.`);
        const existingData = document.getElementById(`${canvas.id}-data`);
        existingData?.remove();
        const details = document.createElement('details'); details.className = 'staff-chart-data'; details.id = `${canvas.id}-data`;
        const summary = document.createElement('summary'); summary.textContent = 'View chart data'; details.append(summary);
        const wrap = document.createElement('div'); wrap.className = 'table-wrap'; const table = document.createElement('table'); table.className = 'data-table';
        const head = table.createTHead().insertRow();
        ['Period / category', ...(config.data.datasets || []).map((d) => d.label || 'Value')].forEach((label) => { const th = document.createElement('th'); th.textContent = label; th.scope = 'col'; head.append(th); });
        const body = table.createTBody();
        (config.data.labels || []).forEach((label, index) => { const row = body.insertRow(); row.insertCell().textContent = label; (config.data.datasets || []).forEach((dataset) => { row.insertCell().textContent = dataset.data[index] ?? '\u2014'; }); });
        wrap.append(table); details.append(wrap); canvas.parentElement.append(details);
    }
    return new window.Chart(canvas, config);
}

function renderChartOnView(canvasId, factory) {
    const canvas = document.getElementById(canvasId);
    if (!(canvas instanceof HTMLCanvasElement) || typeof factory !== 'function') {
        return;
    }

    const mountChart = () => {
        if (canvas.dataset.chartMounted === 'true') {
            return;
        }

        canvas.dataset.chartMounted = 'true';
        factory(canvas);
    };

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
        mountChart();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            mountChart();
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.2,
    });

    observer.observe(canvas);
}

function initializeMotion() {
    if (document.body.classList.contains('staff-workspace')) {
        initializeStaffWorkspace();
        return;
    }
    initReveal(document);
    initHeaderDepth();
    initParallax();
}

function initParallax() {
    if (prefersReducedMotion()) {
        return;
    }

    const layers = Array.from(document.querySelectorAll('[data-parallax]')).filter((el) => el instanceof HTMLElement);
    if (!layers.length) {
        return;
    }

    const update = () => {
        const scrollY = window.scrollY;
        layers.forEach((layer) => {
            const speed = Number.parseFloat(layer.dataset.parallax ?? '0.08');
            const offset = Math.max(Math.min(scrollY * speed, 48), -48);
            layer.style.transform = `translate3d(0, ${offset}px, 0)`;
        });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
}

window.glmsBuildChart = buildChart;
window.glmsRenderChartOnView = renderChartOnView;

document.addEventListener('DOMContentLoaded', initializeMotion);
document.addEventListener('livewire:navigated', initializeMotion);
document.addEventListener('livewire:load', initializeMotion);

if (isStaffWorkspace) Livewire.start();
else Alpine.start();

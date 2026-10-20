// Native dialogs supply focus containment and Escape behavior without another UI framework.
const focusable = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]';
let fieldSequence = 0;

function openDialog(dialog, trigger) {
    if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
    dialog.staffTrigger = trigger ?? document.activeElement;
    dialog.showModal();
}

function closeDialog(dialog) {
    if (!(dialog instanceof HTMLDialogElement)) return;
    dialog.close();
}

function setupFields(root, feedback) {
    root.querySelectorAll('input:not([type="hidden"]),select,textarea').forEach((control) => {
        if (control.dataset.staffFieldReady) return;
        control.dataset.staffFieldReady = 'true';
        control.id ||= `staff-field-${++fieldSequence}`;
        let label = control.labels?.[0];
        if (!label) {
            const preceding = control.previousElementSibling;
            if (preceding?.tagName === 'LABEL' && !preceding.control) {
                label = preceding;
                label.htmlFor = control.id;
            } else if (!['checkbox', 'radio'].includes(control.type) && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
                label = document.createElement('label');
                label.htmlFor = control.id;
                label.className = 'staff-generated-label';
                label.textContent = ({search:'Search learners', date_from:'From', date_to:'To', section_id:'Section', topic_id:'Topic', lesson_id:'Lesson', teacher_id:'Teacher'}[control.name]) || control.placeholder || (control.name || control.getAttribute('wire:model.live') || control.getAttribute('wire:model') || 'Value').replace(/_id$/, '').replace(/[_\[\].]+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase());
                const wrapper = document.createElement('div');
                wrapper.className = 'staff-field';
                const spanClass = [...control.classList].filter((name) => /col-span/.test(name));
                wrapper.classList.add(...spanClass);
                control.before(wrapper);
                wrapper.append(label, control);
            }
        }
        if (label && !label.htmlFor && !label.contains(control)) label.htmlFor = control.id;
    });
    root.querySelectorAll('form').forEach((form, index) => {
        const key = `${form.getAttribute('action') || location.pathname}#${form.id || index}`;
        const isPost = form.method.toLowerCase() === 'post';
        if (isPost && !form.querySelector('[name="_workspace_form"]')) {
            const marker = document.createElement('input');
            marker.type = 'hidden'; marker.name = '_workspace_form'; marker.value = key;
            form.append(marker);
        }
        if (!isPost || feedback.old?._workspace_form !== key || form.dataset.feedbackReady) return;
        form.dataset.feedbackReady = 'true';
        let firstInvalid = null;
        // Include grading controls associated with a form via the form attribute.
        [...form.elements].forEach((control) => {
            if (!control.name || control.type === 'hidden' || control.type === 'password') return;
            const path = control.name.replace(/\]/g, '').split(/\[|\./);
            if (path.at(-1) === '') {
                if (control.type === 'checkbox') path.pop();
                else path[path.length - 1] = `${[...form.elements].filter((el) => el.name === control.name).indexOf(control)}`;
            }
            let old = feedback.old;
            for (const part of path) old = old?.[part];
            if (old !== undefined) {
                if (['checkbox', 'radio'].includes(control.type)) control.checked = Array.isArray(old) ? old.map(String).includes(control.value) : `${old}` === control.value;
                else control.value = old ?? '';
                control.dispatchEvent(new Event('input', { bubbles: true }));
                control.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (control.type === 'checkbox') control.checked = false;
            const errors = feedback.errors?.[path.join('.')];
            if (errors?.length) {
                firstInvalid ??= control;
                control.setAttribute('aria-invalid', 'true');
                const error = document.createElement('p');
                error.id = `${control.id}-error`; error.className = 'staff-field-error'; error.textContent = errors.join(' ');
                control.after(error);
                control.setAttribute('aria-describedby', [control.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
            }
        });
        let ancestor = form.parentElement;
        while (ancestor) { if (ancestor.tagName === 'DETAILS') ancestor.open = true; ancestor = ancestor.parentElement; }
        const dialog = form.closest('dialog');
        if (dialog && Object.keys(feedback.errors ?? {}).length) openDialog(dialog, document.querySelector(`[data-open-dialog="${dialog.id}"]`));
        requestAnimationFrame(() => firstInvalid?.focus());
    });
}

function setupTables(root) {
    root.querySelectorAll('.table-wrap').forEach((wrap) => {
        if (!wrap.hasAttribute('aria-label')) {
            const panel = wrap.closest('section,article');
            wrap.setAttribute('aria-label', `${panel?.querySelector('h2,h3')?.textContent.trim() || 'Data table'} - scroll horizontally for more columns`);
            wrap.tabIndex = 0;
            wrap.setAttribute('role', 'region');
        }
        const table = wrap.querySelector('table');
        if (!table || table.dataset.staffTableReady) return;
        table.dataset.staffTableReady = 'true';
        table.querySelectorAll('thead th').forEach((th) => th.setAttribute('scope', th.colSpan > 1 ? 'colgroup' : 'col'));
        if (table.classList.contains('grading-table')) return;
        const headers = [...table.querySelectorAll('thead tr:first-child th')];
        headers.forEach((th, index) => {
            if (!/^(MPS|Attainment|Learners|Students|Attempts|Average|Accuracy|Mastery|Completion|Score|Total|Points|Risk|Grade$|WW |QA )/i.test(th.textContent.trim())) return;
            th.classList.add('staff-numeric');
            table.querySelectorAll('tbody tr').forEach((row) => row.children[index]?.classList.add('staff-numeric'));
        });
    });
}

function setupFilters(root) {
    root.querySelectorAll('.filter-panel form').forEach((form) => {
        if (form.method.toLowerCase() === 'post' || form.hasAttribute('wire:submit.prevent') || form.querySelector('[data-filter-reset]')) return;
        if ([...form.querySelectorAll('a')].some((a) => /reset|clear/i.test(a.textContent))) return;
        const reset = document.createElement('a');
        reset.href = form.action.split('?')[0]; reset.className = 'btn-secondary'; reset.textContent = 'Reset'; reset.dataset.filterReset = 'true';
        const button = form.querySelector('button[type="submit"],button:not([type])');
        if (button) {
            const actions = document.createElement('div'); actions.className = 'staff-filter-actions';
            button.before(actions); actions.append(button, reset);
        } else form.append(reset);
    });
}

function setupPolicyWeights(root) {
    root.querySelectorAll('form').forEach((form) => {
        const fields = ['gamified_weight', 'formative_weight', 'summative_weight'].map((name) => form.querySelector(`[name="${name}"]`));
        if (fields.some((field) => !field) || form.dataset.weightsReady) return;
        form.dataset.weightsReady = 'true';
        const hint = document.createElement('p'); hint.className = 'section-copy'; hint.setAttribute('aria-live', 'polite');
        fields.at(-1).closest('div').after(hint);
        const update = () => {
            const total = fields.reduce((sum, field) => sum + Number(field.value || 0), 0);
            hint.textContent = `Component weights: ${total}% of 100%`;
            fields[0].setCustomValidity(total === 100 ? '' : 'Component weights must total exactly 100%.');
            hint.classList.toggle('staff-field-error', total !== 100);
        };
        fields.forEach((field) => field.addEventListener('input', update)); update();
    });
}

function setupSidebar() {
    const sidebar = document.getElementById('staff-navigation');
    const content = document.querySelector('.staff-content');
    const backdrop = document.querySelector('.staff-drawer-backdrop');
    const trigger = document.querySelector('[data-open-sidebar]');
    const mobile = window.matchMedia('(max-width: 1023px)');
    function close(restore = true) {
        sidebar.classList.remove('is-open'); backdrop.hidden = true;
        content.inert = false; document.body.style.overflow = '';
        trigger.setAttribute('aria-expanded', 'false');
        sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal');
        if (restore) trigger.focus();
    }
    trigger.addEventListener('click', () => {
        sidebar.classList.add('is-open'); backdrop.hidden = false; content.inert = true;
        document.body.style.overflow = 'hidden'; trigger.setAttribute('aria-expanded', 'true');
        sidebar.setAttribute('role', 'dialog'); sidebar.setAttribute('aria-modal', 'true');
        sidebar.querySelector('[data-close-sidebar]').focus();
    });
    document.querySelectorAll('[data-close-sidebar]').forEach((button) => button.addEventListener('click', () => close()));
    sidebar.addEventListener('keydown', (event) => {
        if (!mobile.matches || !sidebar.classList.contains('is-open')) return;
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key === 'Tab') {
            const items = [...sidebar.querySelectorAll(focusable)].filter((el) => el.getClientRects().length);
            if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
            else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
        }
    });
    mobile.addEventListener('change', () => close(false));
}

function setupConfirmation() {
    document.querySelectorAll('form[data-confirm-archive]').forEach((form, index) => {
        form.removeAttribute('onsubmit');
        const dialog = document.createElement('dialog'); dialog.className = 'staff-dialog';
        const heading = document.createElement('h2'); heading.id = `archive-title-${index}`; heading.textContent = 'Archive student?';
        dialog.setAttribute('aria-labelledby', heading.id);
        const body = document.createElement('div'); body.className = 'staff-dialog-content';
        const message = document.createElement('p'); message.textContent = 'This learner will be marked as archived. Their existing learning records will be retained.';
        const actions = document.createElement('div'); actions.className = 'staff-page-actions mt-5';
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'btn-secondary'; cancel.textContent = 'Cancel';
        const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'btn-primary'; confirm.textContent = 'Archive student';
        body.append(heading, message, actions); actions.append(cancel, confirm); dialog.append(body); document.body.append(dialog);
        form.addEventListener('submit', (event) => { event.preventDefault(); openDialog(dialog, event.submitter); cancel.focus(); });
        cancel.addEventListener('click', () => closeDialog(dialog));
        confirm.addEventListener('click', () => { confirm.disabled = true; form.submit(); });
    });
}

export function initializeStaffWorkspace() {
    if (!document.body.classList.contains('staff-workspace')) return;
    if (document.body.dataset.staffReady) return;
    document.body.dataset.staffReady = 'true';
    const feedback = JSON.parse(document.getElementById('staff-form-feedback')?.textContent || '{}');
    setupSidebar(); setupConfirmation();
    const enhance = () => { setupFields(document.querySelector('.staff-main'), feedback); setupTables(document.querySelector('.staff-main')); setupFilters(document.querySelector('.staff-main')); setupPolicyWeights(document.querySelector('.staff-main')); };
    enhance();
    document.addEventListener('click', (event) => {
        const opener = event.target.closest('[data-open-dialog]');
        if (opener) openDialog(document.getElementById(opener.dataset.openDialog), opener);
        const closer = event.target.closest('[data-close-dialog]');
        if (closer) closeDialog(closer.closest('dialog'));
    });
    document.querySelectorAll('dialog').forEach((dialog) => {
        dialog.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab') return;
            const items = [...dialog.querySelectorAll(focusable)].filter((el) => el.getClientRects().length);
            if (!items.length) return;
            if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
            else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
        });
        dialog.addEventListener('close', () => dialog.staffTrigger?.focus());
        dialog.addEventListener('click', (event) => {
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
        });
    });
    let queued = false;
    new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; enhance(); });
    }).observe(document.querySelector('.staff-main'), { childList: true, subtree: true });
}

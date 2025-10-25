// You don't have the right to copy this code without permission from the author.
// Author: Yassine Ghoudi (https://github.com/ghoudiy/)

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sectionSelector = document.getElementById('section-selector');
    const subjectsList = document.getElementById('subjects-list');
    const otherSubjectsList = document.getElementById('other-subjects-list');
    const calendarGrid = document.getElementById('calendar-grid');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const templatesBtn = document.getElementById('templates-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const templatesModal = document.getElementById('templates-modal');
    const closeModalBtn = templatesModal.querySelector('.close-btn');
    const templateOptions = document.querySelector('.template-options');
    const modalTitle = templatesModal.querySelector('h2');
    const manageColorsBtn = document.getElementById('manage-colors-btn');
    const colorsModal = document.getElementById('colors-modal');
    const closeColorsModalBtn = colorsModal.querySelector('.close-btn');
    const colorSettingsList = document.getElementById('color-settings-list');
    const saveColorsBtn = document.getElementById('save-colors-btn');
    const customDialogModal = document.getElementById('custom-dialog-modal');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogMessage = document.getElementById('dialog-message');
    const dialogInput = document.getElementById('dialog-input');
    const dialogButtons = document.getElementById('dialog-buttons');

    // Mobile View Elements
    const dailyView = document.getElementById('daily-view');
    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');
    const dailyViewDate = document.getElementById('daily-view-date');
    const dailySlotsContainer = document.querySelector('.daily-slots-container');
    const subjectsDrawer = document.getElementById('subjects-drawer');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const drawerContent = document.querySelector('.drawer-content');


    // State
    let schedule = {};
    let undoStack = [];
    let redoStack = [];

    let subjectColors = {};
    let templatesManifest = {};
    let currentMobileDayIndex = 0;
    let activeSlotForAdding = null; // To know where to add a subject on mobile
    // Add these missing global variables
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayNames = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const timeSlots = ['fajer', 'morning', 'dhuhr', 'evening', 'night'];

    let tajawalFontBase64 = ''; // Global variable to store font data
    let playpenSansArabicBase64 = ''; // Global variable to store font data
    let sparklesImageBase64 = ''; // Global variable to store image data
    let newlogoImageBase64 = ''; // Global variable to store image data

    // Fetch font data and register with pdfMake once on load
    fetch('fonts/tajawal_base64.txt')
        .then(response => {
            if (!response.ok) throw new Error('Could not fetch font data.');
            return response.text();
        })
        .then(base64Data => {
            tajawalFontBase64 = base64Data;
            pdfMake.vfs['Tajawal-Regular.ttf'] = tajawalFontBase64;
        })
        .catch(error => console.error('Error loading Tajawal font for PDFMake:', error));

    fetch('fonts/playpen_base64.txt')
        .then(response => {
            if (!response.ok) throw new Error('Could not fetch font data.');
            return response.text();
        })
        .then(base64Data => {
            playpenSansArabicBase64 = base64Data;
            pdfMake.vfs['PlaypenSansArabic.ttf'] = playpenSansArabicBase64;
        })
        .catch(error => console.error('Error loading Playpen Sans Arabic font for PDFMake:', error));

    fetch('images/sparkles_base64.txt')
        .then(response => {
            if (!response.ok) throw new Error('Could not fetch sparkles image data.');
            return response.text();
        })
        .then(base64Data => {
            sparklesImageBase64 = 'data:image/png;base64,' + base64Data;
        })
        .catch(error => console.error('Error loading sparkles image for PDFMake:', error));

    fetch('images/new_logo_base64.txt')
        .then(response => {
            if (!response.ok) throw new Error('Could not fetch new logo image data.');
            return response.text();
        })
        .then(base64Data => {
            newlogoImageBase64 = 'data:image/png;base64,' + base64Data;
        })
        .catch(error => console.error('Error loading logo image for PDFMake:', error));

    // PDFMake Global Font Definition
    pdfMake.fonts = {
        Tajawal: {
            normal: 'Tajawal-Regular.ttf',
            bold: 'Tajawal-Regular.ttf',
            italics: 'Tajawal-Regular.ttf',
            bolditalics: 'Tajawal-Regular.ttf'
        },
        PlaypenSansArabic: {
            normal: 'PlaypenSansArabic.ttf',
            bold: 'PlaypenSansArabic.ttf',
            italics: 'PlaypenSansArabic.ttf',
            bolditalics: 'PlaypenSansArabic.ttf'
        }
    };



    const timeSlotNames = ['فجر', 'صباح', 'ظهر', 'مساء', 'ليل'];

    // --- CUSTOM DIALOG --- 
    function showCustomDialog(title, message, type = 'alert', options = {}) {
        return new Promise(resolve => {
            dialogTitle.textContent = title;
            dialogMessage.textContent = message;
            dialogButtons.innerHTML = '';

            if (type === 'prompt') {
                dialogInput.classList.remove('hidden');
                dialogInput.value = options.defaultValue || '';
            } else {
                dialogInput.classList.add('hidden');
            }

            function closeDialog(value) {
                customDialogModal.classList.add('hidden');
                resolve(value);
            }

            const buttons = options.buttons || [];
            if (buttons.length > 0) {
                buttons.forEach(btnConfig => {
                    const button = document.createElement('button');
                    button.textContent = btnConfig.text;
                    button.className = btnConfig.className;
                    button.onclick = () => closeDialog(btnConfig.value);
                    dialogButtons.appendChild(button);
                });
            } else {
                if (type === 'alert') {
                    const okBtn = document.createElement('button');
                    okBtn.textContent = 'موافق';
                    okBtn.className = 'confirm-btn';
                    okBtn.onclick = () => closeDialog(true);
                    dialogButtons.appendChild(okBtn);
                } else if (type === 'confirm' || type === 'prompt') {
                    const confirmBtn = document.createElement('button');
                    confirmBtn.textContent = 'موافق';
                    confirmBtn.className = 'confirm-btn';
                    confirmBtn.onclick = () => closeDialog(type === 'prompt' ? dialogInput.value : true);
                    dialogButtons.appendChild(confirmBtn);

                    const cancelBtn = document.createElement('button');
                    cancelBtn.textContent = 'إلغاء';
                    cancelBtn.className = 'cancel-btn';
                    cancelBtn.onclick = () => closeDialog(type === 'prompt' ? null : false);
                    dialogButtons.appendChild(cancelBtn);
                }
            }

            customDialogModal.classList.remove('hidden');
        });
    }

    // --- INITIALIZATION ---
    async function init() {
        await loadColors();
        loadSection();
        loadSchedule(); // Load data
        loadSubjects(); 
        setupEventListeners();
        
        // Set initial day for mobile view to today
        const today = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
        currentMobileDayIndex = (today + 6) % 7; // Adjust to our days array (Monday = 0)

        saveState(); // Save the initial state before the first render
        render(); // Perform the single, final render
    }

    function loadSection() {
        const savedSection = localStorage.getItem('selectedSection');
        if (savedSection) {
            sectionSelector.value = savedSection;
        }
    }

    async function loadColors() {
        let defaultColors = {};
        try {
            const response = await fetch('subjects/colors.json');
            if (!response.ok) {
                throw new Error('Failed to load colors.json');
            }
            defaultColors = await response.json();
        } catch (error) {
            console.error('Error loading default colors:', error);
        }

        const savedColors = localStorage.getItem('userSubjectColors');
        if (savedColors) {
            subjectColors = { ...defaultColors, ...JSON.parse(savedColors) };
        } else {
            subjectColors = defaultColors;
        }
    }

    // --- GLOBAL RENDER FUNCTION ---
    function render() {
        if (isMobile()) {
            renderDailyView();
        } else {
            renderCalendar();
        }
        updateUndoRedoButtons();
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    // --- RENDERING FUNCTIONS ---
    function renderCalendar() {
        calendarGrid.innerHTML = ''; // Clear previous render
        calendarGrid.appendChild(document.createElement('div'));
        dayNames.forEach(name => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = name;
            calendarGrid.appendChild(dayHeader);
        });

        timeSlots.forEach((slot, slotIndex) => {
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = timeSlotNames[slotIndex];
            calendarGrid.appendChild(timeLabel);

            days.forEach(day => {
                const timeBlock = document.createElement('div');
                timeBlock.className = 'time-block';
                timeBlock.dataset.day = day;
                timeBlock.dataset.slot = slot;
                calendarGrid.appendChild(timeBlock);
            });
        });

        renderSchedule();
    }

    function renderDailyView() {
        dailySlotsContainer.innerHTML = '';
        const currentDay = days[currentMobileDayIndex];
        dailyViewDate.textContent = dayNames[currentMobileDayIndex];

        timeSlots.forEach((slot, slotIndex) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'daily-slot';

            const timeEl = document.createElement('div');
            timeEl.className = 'daily-slot-time';
            timeEl.textContent = timeSlotNames[slotIndex];
            slotEl.appendChild(timeEl);

            const contentEl = document.createElement('div');
            contentEl.className = 'daily-slot-content';

            // Render existing subjects
            const subjectsInSlot = schedule[currentDay]?.[slot] || [];
            subjectsInSlot.forEach((subject, index) => {
                const subjectEl = createPlacedSubjectElement(subject, currentDay, slot, index);
                contentEl.appendChild(subjectEl);
            });

            // Always render the "Add" button
            const addButton = document.createElement('button');
            addButton.className = 'add-subject-btn-mobile';
            addButton.textContent = '+ إضافة مادة';
            addButton.dataset.day = currentDay;
            addButton.dataset.slot = slot;
            contentEl.appendChild(addButton);

            slotEl.appendChild(contentEl);
            dailySlotsContainer.appendChild(slotEl);
        });
    }

    async function loadSubjects() {
        const selectedSection = sectionSelector.value;
        subjectsList.innerHTML = '';
        otherSubjectsList.innerHTML = '';
        drawerContent.innerHTML = ''; // Clear drawer

        try {
            const response = await fetch(`subjects/${selectedSection}.json`);
            const subjects = await response.json();
            subjects.forEach(subject => {
                addSubjectToPanel(subject, subjectsList);
                addSubjectToPanel(subject, drawerContent, true); // Add to drawer
            });

            const otherResponse = await fetch('subjects/other.json');
            const otherSubjects = await otherResponse.json();
            otherSubjects.forEach(subject => {
                addSubjectToPanel(subject, otherSubjectsList);
                addSubjectToPanel(subject, drawerContent, true); // Add to drawer
            });

        } catch (error) {
            console.error('Error loading subjects:', error);
            subjectsList.innerHTML = '<p>خطأ في تحميل المواد.</p>';
        }
    }

    function addSubjectToPanel(subject, listElement, isDrawer = false) {
        const subjectEl = document.createElement('div');
        subjectEl.className = 'subject-item';
        subjectEl.textContent = subject.name;
        const color = subjectColors[subject.name] || '#6c757d';
        subjectEl.style.backgroundColor = color;
        subjectEl.dataset.subjectName = subject.name;

        if (isDrawer) {
            // For the drawer, we don't need drag-and-drop
            subjectEl.addEventListener('click', () => addSubjectFromDrawer(subject.name));
        } else {
            subjectEl.draggable = true;
        }
        
        listElement.appendChild(subjectEl);
    }

    function renderSchedule() {
        // This function is now only for the desktop grid
        document.querySelectorAll('#calendar-grid .placed-subject').forEach(el => el.remove());

        for (const day in schedule) {
            for (const slot in schedule[day]) {
                const timeBlock = document.querySelector(`.time-block[data-day='${day}'][data-slot='${slot}']`);
                if (timeBlock) {
                    schedule[day][slot].forEach((subject, index) => {
                        const subjectEl = createPlacedSubjectElement(subject, day, slot, index);
                        timeBlock.appendChild(subjectEl);
                    });
                }
            }
        }
    }

    function addSubjectFromDrawer(subjectName) {
        if (!activeSlotForAdding) return;

        const { day, slot } = activeSlotForAdding;
        const color = subjectColors[subjectName] || '#6c757d';
        const newSubject = { subject: subjectName, color, width: 100 }; // Mobile subjects are always 100% width

        if (!schedule[day]) schedule[day] = {};
        if (!schedule[day][slot]) schedule[day][slot] = [];
        
        schedule[day][slot].push(newSubject);

        saveState();
        render();
        saveSchedule();

        // Hide the drawer
        subjectsDrawer.classList.remove('visible');
        activeSlotForAdding = null;
    }

    function createPlacedSubjectElement(subject, day, slot, index) {
        const subjectEl = document.createElement('div');
        subjectEl.className = 'placed-subject';
        subjectEl.textContent = subject.subject;
        subjectEl.style.backgroundColor = subject.color;
        subjectEl.style.width = `${subject.width}%`;
        subjectEl.dataset.day = day;
        subjectEl.dataset.slot = slot;
        subjectEl.dataset.index = index;
        subjectEl.draggable = true;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-subject-btn';
        deleteBtn.innerHTML = '&times;';
        subjectEl.appendChild(deleteBtn);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        subjectEl.appendChild(resizeHandle);

        return subjectEl;
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        sectionSelector.addEventListener('change', () => {
            localStorage.setItem('selectedSection', sectionSelector.value);
            loadSubjects();
            if (!colorsModal.classList.contains('hidden')) {
                openColorsModal();
            }
        });
        clearAllBtn.addEventListener('click', clearAll);

        // --- Desktop Drag and Drop Listeners ---
        document.addEventListener('dragstart', e => {
            if (e.target.classList.contains('subject-item')) {
                const subjectName = e.target.dataset.subjectName;
                e.dataTransfer.setData('text/plain', JSON.stringify({ subject: subjectName, isPlaced: false }));
                e.target.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', e => {
            if (e.target.classList.contains('subject-item')) {
                e.target.classList.remove('dragging');
            }
        });

        calendarGrid.addEventListener('dragstart', e => {
            if (e.target.classList.contains('placed-subject')) {
                const { day, slot, index } = e.target.dataset;
                e.dataTransfer.setData('text/plain', JSON.stringify({ isPlaced: true, originalDay: day, originalSlot: slot, originalIndex: parseInt(index) }));
                e.target.classList.add('dragging');
            }
        });

        calendarGrid.addEventListener('dragend', e => {
            if (e.target.classList.contains('placed-subject')) {
                e.target.classList.remove('dragging');
            }
        });

        calendarGrid.addEventListener('dragover', e => {
            e.preventDefault();
            const targetBlock = e.target.closest('.time-block');
            if (targetBlock) {
                targetBlock.classList.add('drag-over');
            }
        });

        calendarGrid.addEventListener('dragleave', e => {
            const targetBlock = e.target.closest('.time-block');
            if (targetBlock) {
                targetBlock.classList.remove('drag-over');
            }
        });

        calendarGrid.addEventListener('drop', e => {
            e.preventDefault();
            const targetBlock = e.target.closest('.time-block');
            if (!targetBlock) return;

            targetBlock.classList.remove('drag-over');
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const { day: newDay, slot: newSlot } = targetBlock.dataset;

            if (data.isPlaced) {
                const { originalDay, originalSlot, originalIndex } = data;
                if (originalDay === newDay && originalSlot === newSlot) return;

                const subjectToMove = schedule[originalDay][originalSlot][originalIndex];
                schedule[originalDay][originalSlot].splice(originalIndex, 1);
                recalculateWidths(originalDay, originalSlot);

                if (!schedule[newDay]) schedule[newDay] = {};
                if (!schedule[newDay][newSlot]) schedule[newDay][newSlot] = [];
                schedule[newDay][newSlot].push(subjectToMove);
                recalculateWidths(newDay, newSlot);
            } else {
                const color = subjectColors[data.subject] || '#6c757d';
                const newSubject = { ...data, color, width: 0 };
                if (!schedule[newDay]) schedule[newDay] = {};
                if (!schedule[newDay][newSlot]) schedule[newDay][newSlot] = [];
                schedule[newDay][newSlot].push(newSubject);
                recalculateWidths(newDay, newSlot);
            }

            saveState();
            render();
            saveSchedule();
        });

        // --- Main Click Handler (for deletes on both views) ---
        document.addEventListener('click', e => {
            // Desktop and Mobile delete
            if (e.target.classList.contains('delete-subject-btn')) {
                const subjectEl = e.target.closest('.placed-subject');
                const { day, slot, index } = subjectEl.dataset;
                schedule[day][slot].splice(index, 1);
                recalculateWidths(day, slot); // Recalculate for desktop view
                saveState();
                render();
                saveSchedule();
            }

            // Mobile "Add Subject" button
            if (e.target.classList.contains('add-subject-btn-mobile')) {
                const { day, slot } = e.target.dataset;
                activeSlotForAdding = { day, slot };
                subjectsDrawer.classList.add('visible');
            }
        });

        // --- Other Listeners ---
        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
        });

        templatesBtn.addEventListener('click', startTemplateConversation);
        closeModalBtn.addEventListener('click', () => templatesModal.classList.add('hidden'));

        manageColorsBtn.addEventListener('click', openColorsModal);
        closeColorsModalBtn.addEventListener('click', () => colorsModal.classList.add('hidden'));
        saveColorsBtn.addEventListener('click', saveColors);

        exportPdfBtn.addEventListener('click', exportToPdf);

        calendarGrid.addEventListener('mousedown', initResize);

        // --- Mobile-Specific Listeners ---
        prevDayBtn.addEventListener('click', () => {
            currentMobileDayIndex = (currentMobileDayIndex - 1 + 7) % 7;
            renderDailyView();
        });

        nextDayBtn.addEventListener('click', () => {
            currentMobileDayIndex = (currentMobileDayIndex + 1) % 7;
            renderDailyView();
        });

        closeDrawerBtn.addEventListener('click', () => {
            subjectsDrawer.classList.remove('visible');
            activeSlotForAdding = null;
        });

        window.addEventListener('resize', () => {
            render();
        });
    }

    // --- DATA & STATE MANAGEMENT ---
    function saveSchedule() {
        localStorage.setItem('studentSchedule', JSON.stringify(schedule));
    }

    function loadSchedule() {
        const savedSchedule = localStorage.getItem('studentSchedule');
        if (savedSchedule) {
            schedule = JSON.parse(savedSchedule);
        } else {
            // Initialize empty schedule
            days.forEach(day => {
                schedule[day] = {};
                timeSlots.forEach(slot => { schedule[day][slot] = []; });
            });
        }
    }

    function saveState() {
        undoStack.push(JSON.parse(JSON.stringify(schedule)));
        if (undoStack.length > 51) undoStack.shift();
        redoStack = [];
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        undoBtn.disabled = undoStack.length <= 1;
        redoBtn.disabled = redoStack.length === 0;
    }

    function recalculateWidths(day, slot) {
        if (schedule[day] && schedule[day][slot]) {
            const subjects = schedule[day][slot];
            const count = subjects.length;
            if (count > 0) {
                const newWidth = 100 / count;
                subjects.forEach(subject => subject.width = newWidth);
            }
        }
    }

    // --- ACTIONS ---
    async function clearAll() {
        const confirmed = await showCustomDialog('مسح الكل', 'هل أنت متأكد من أنك تريد مسح الجدول بالكامل؟', 'confirm');
        if (confirmed) {
            days.forEach(day => {
                schedule[day] = {};
                timeSlots.forEach(slot => { schedule[day][slot] = []; });
            });
            saveState();
            render();
            saveSchedule();
        }
    }

    function undo() {
        if (undoStack.length > 1) {
            redoStack.push(undoStack.pop());
            schedule = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1]));
            render();
            saveSchedule();
            updateUndoRedoButtons(); // Also update buttons here
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            undoStack.push(nextState);
            schedule = JSON.parse(JSON.stringify(nextState));
            render();
            saveSchedule();
            updateUndoRedoButtons(); // Also update buttons here
        }
    }

    // --- TEMPLATE LOGIC ---
    async function loadTemplatesManifest() {
        const response = await fetch('templates/templates_manifest.json');
        templatesManifest = await response.json();
    }

    async function startTemplateConversation() {
        await loadTemplatesManifest();
        const selectedGoal = 'essential';
        const selectedFocus = 'balanced';

        const wantsFajer = await showCustomDialog('وقت الفجر', 'هل تدرس في وقت الفجر؟', 'confirm', {
            buttons: [
                { text: 'نعم', className: 'confirm-btn', value: true },
                { text: 'لا', className: 'cancel-btn', value: false }
            ]
        });

        if (wantsFajer) {
            applyTemplate(selectedGoal, selectedFocus, true);
        } else {
            const prayerStatus = await showCustomDialog('صلاة الفجر', 'هل تصلي الفجر؟', 'choice', {
                buttons: [
                    { text: 'نعم', className: 'confirm-btn', value: 'yes' },
                    { text: 'أنا لا أصلي 😢️', className: 'cancel-btn', value: 'no_prayer' },
                    { text: 'لا أصليه حاضرا 😓️', className: 'cancel-btn', value: 'not_on_time' }
                ]
            });

            if (prayerStatus === 'yes') {
                applyTemplate(selectedGoal, selectedFocus, false);
            } else if (prayerStatus === 'no_prayer') {
                const prayerResponse = await showCustomDialog('سؤال', 'متى ستصلي؟', 'choice', {
                    buttons: [
                        { text: 'من اليوم ❤️', className: 'confirm-btn', value: 'today' },
                        { text: 'ربي يهدي', className: 'cancel-btn', value: 'rabi_yehdi' }
                    ]
                });

                if (prayerResponse === 'today') {
                    await showCustomDialog('دعاء', "ما شاء الله! خطوة مباركة. أسأل الله لي ولك الثبات");
                } else if (prayerResponse === 'rabi_yehdi') {
                    await showCustomDialog('تذكير', "عن الحسن البصري أنه قال: ليس الإيمان بالتمنِّي، ولكن ما وقَر في القلب وصدّقه العمل");
                }
                applyTemplate(selectedGoal, selectedFocus, false);
            } else if (prayerStatus === 'not_on_time') {
                await showCustomDialog('تذكير', "وعن جُنْدِبِ بن عبداللَّه قَالَ: قَالَ رسولُ اللَّه ﷺ: مَنْ صَلَّى صَلاةَ الصُّبحِ فَهُوَ فِي ذِمَّةِ اللَّهِ");
                applyTemplate(selectedGoal, selectedFocus, false);
            }
        }
    }



    async function applyTemplate(goal, focus, useFajer) {
        const confirmed = await showCustomDialog('تطبيق القالب', 'تطبيق القالب سيؤدي إلى مسح الجدول الحالي. هل تريد المتابعة؟', 'confirm');
        if (!confirmed) return;

        const currentSection = sectionSelector.value;
        let fileName = `${goal}_${focus}.json`;
        let template;

        if (useFajer) {
            const fajerFileName = `${goal}_${focus}_fajer.json`;
            try {
                const response = await fetch(`templates/${currentSection}/${fajerFileName}`);
                if (response.ok) {
                    fileName = fajerFileName;
                    template = await response.json();
                } else {
                    console.log(`Fajer template not found for ${currentSection}, falling back.`);
                }
            } catch (error) {
                console.log(`Fajer template fetch failed for ${currentSection}, falling back.`);
            }
        }

        try {
            if (!template) {
                const response = await fetch(`templates/${currentSection}/${fileName}`);
                if (!response.ok) throw new Error(`Template not found: ${fileName}`);
                template = await response.json();
            }

            const newSchedule = {};
            days.forEach(day => {
                newSchedule[day] = {};
                timeSlots.forEach(slot => { newSchedule[day][slot] = []; });
            });

            for (const day in template) {
                if (newSchedule[day]) {
                    for (const slot in template[day]) {
                        if (newSchedule[day][slot]) {
                            newSchedule[day][slot] = template[day][slot].map(subject => ({
                                ...subject,
                                color: subjectColors[subject.subject] || '#6c757d'
                            }));
                        } else {
                            console.warn(`Slot ${slot} does not exist in newSchedule for day ${day}`);
                        }
                    }
                }
            }

            schedule = newSchedule;
            saveState();
            render();
            saveSchedule();
        } catch (error) {
            console.error('Error applying template:', error);
            await showCustomDialog('خطأ', 'حدث خطأ أثناء تطبيق القالب.');
        }
    }

    // --- COLOR MANAGEMENT ---
    async function openColorsModal() {
        colorSettingsList.innerHTML = '';
        const selectedSection = sectionSelector.value;
        let sectionSubjects = [];

        try {
            const [subjectsResponse, otherSubjectsResponse] = await Promise.all([
                fetch(`subjects/${selectedSection}.json`),
                fetch('subjects/other.json')
            ]);
            const subjects = await subjectsResponse.json();
            const otherSubjects = await otherSubjectsResponse.json();
            sectionSubjects = [...subjects.map(s => s.name), ...otherSubjects.map(s => s.name)];
        } catch (error) {
            console.error('Error loading subjects for color modal:', error);
            colorSettingsList.innerHTML = '<p>خطأ في تحميل المواد.</p>';
            return;
        }

        const uniqueSubjects = [...new Set(sectionSubjects)];
        uniqueSubjects.sort();

        uniqueSubjects.forEach(subjectName => {
            const color = subjectColors[subjectName] || '#6c757d';
            const settingEl = document.createElement('div');
            settingEl.className = 'color-setting';
            settingEl.innerHTML = `
                <label for="color-${subjectName}">${subjectName}</label>
                <input type="color" id="color-${subjectName}" data-subject="${subjectName}" value="${color}">
            `;
            colorSettingsList.appendChild(settingEl);
        });

        colorsModal.classList.remove('hidden');
    }

    function saveColors() {
        const colorInputs = colorSettingsList.querySelectorAll('input[type="color"]');
        colorInputs.forEach(input => {
            subjectColors[input.dataset.subject] = input.value;
        });
        localStorage.setItem('userSubjectColors', JSON.stringify(subjectColors));
        colorsModal.classList.add('hidden');
        loadSubjects();
        render(); // Use main render function
    }


    function reverseRtlWords(str) {
        const arabicRegex = /[\u0600-\u06FF]/;
        if (str && str.includes(' ') && arabicRegex.test(str)) {
            return str.split(' ').reverse().join(' ');
        }
        return str;
    }

    async function exportToPdf() {
        try {
            // Ensure font is loaded before creating PDF
            if (!tajawalFontBase64) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait a bit for font to load
                if (!tajawalFontBase64) {
                    throw new Error('Tajawal font data not loaded.');
                }
            }

            const tableBody = [];
            const headerHeight = 20;
            const dataRowHeight = 80;

            // Final Layout: Header Row [Sun, Sat, ..., Mon, Time]
            const headerRow = [];
            [...dayNames].reverse().forEach(name => headerRow.push({ text: name, style: 'tableHeader' }));
            headerRow.push({ text: 'الوقت', style: 'tableHeader' });
            tableBody.push(headerRow);

            // Data Rows
            timeSlots.forEach((slot, slotIndex) => {
                const row = [];
                
                // Day cells in reverse order
                [...days].reverse().forEach(dayKey => {
                    const subjectsInSlot = schedule[dayKey]?.[slot] || [];
                    
                    if (subjectsInSlot.length > 0) {
                        const N = subjectsInSlot.length;
                        const lastSubjectColor = subjectsInSlot[N - 1].color;

                        // The nested table for individual subject colors
                        const innerRowHeight = dataRowHeight / N;
                        const innerTableBody = subjectsInSlot.map(subject => {
                            const topMargin = Math.max(0, (innerRowHeight / 2) - 4);
                            return [{
                                text: reverseRtlWords(subject.subject),
                                fillColor: subject.color || '#6c757d',
                                color: '#FFFFFF',
                                alignment: 'center',
                                border: [false, false, false, false],
                                margin: [0, topMargin, 0, 0]
                            }];
                        });

                        // Push the cell with the user's suggested fix
                        row.push({
                            fillColor: lastSubjectColor || '#6c757d', // Color the entire cell background
                            table: {
                                widths: ['*'],
                                heights: Array(N).fill(innerRowHeight),
                                body: innerTableBody
                            },
                            layout: 'noBorders'
                        });

                    } else {
                        // Empty cell
                        row.push({ text: '' });
                    }
                });

                // Time cell last
                row.push({ text: timeSlotNames[slotIndex], style: 'tableHeader' });
                tableBody.push(row);
            });

            const docDefinition = {
                pageOrientation: 'landscape',
                header: {
                    columns: [
                        {
                            image: newlogoImageBase64,
                            width: 70,
                            margin: [0, 5, 0, 0]
                        },
                        {
                            text: reverseRtlWords('جدول  المراجعة الأسبوعي'),
                            style: 'documentTitle',
                            alignment: 'center',
                            margin: [0, 20, 60, 0]
                        }
                    ]
                },
                footer: {
                    alignment: 'center',
                    columns: [
                        {
                            text: reverseRtlWords('ثق  أن اللّه يرى سعيك، ولن يضيع تعبك، فابذل السبب واترك النتائج على اللّه '),
                            font: 'PlaypenSansArabic',
                            margin: [0, -10, 0, 0]
                        },
                        {
                            image: sparklesImageBase64,
                            width: 20,
                            margin: [0, -10, 610, 0]
                        }
                    ]
                },
                content: [
                    {
                        style: 'scheduleTable',
                        table: {
                            headerRows: 1,
                            widths: [...Array(days.length).fill('*'), 'auto'],
                            heights: [headerHeight, ...Array(timeSlots.length).fill(dataRowHeight)],
                            body: tableBody
                        },
                        layout: {
                            hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 2 : 1; },
                            vLineWidth: function (i, node) { return (i === 0 || i === node.table.widths.length) ? 2 : 1; },
                            hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#212529' : '#dee2e6'; },
                            vLineColor: function (i, node) { return (i === 0 || i === node.table.widths.length) ? '#212529' : '#dee2e6'; },
                            paddingLeft: function (i, node) { return 0; },
                            paddingRight: function (i, node) { return 0; },
                            paddingTop: function (i, node) { return 0; },
                            paddingBottom: function (i, node) { return 0; }
                        }
                    }
                ],
                defaultStyle: {
                    font: 'Tajawal',
                    alignment: 'right'
                },
                styles: {
                    documentTitle: {
                        fontSize: 20,
                        bold: true,
                        margin: [0, 20, 0, 15]
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 12,
                        color: '#212529',
                        fillColor: '#f8f9fa',
                        alignment: 'center',
                        margin: [0, 5, 0, 5]
                    },
                    scheduleTable: {
                        margin: [0, 25, 0, 15]
                    }
                }
            };

            pdfMake.createPdf(docDefinition).download('schedule.pdf');

        } catch (error) {
            console.error("PDF Export Error:", error);
            await showCustomDialog('خطأ في التصدير', 'لم نتمكن من تصدير الملف. قد تكون هناك مشكلة في تحميل الخط أو معالجة النص العربي.');
        }
    }


    // --- RESIZE IMPLEMENTATION ---
    let initialX, startWidth, elementToResize, sibling, siblingStartWidth;

    function initResize(e) {
        if (!e.target.classList.contains('resize-handle')) return;

        elementToResize = e.target.parentElement;
        sibling = elementToResize.nextElementSibling || elementToResize.previousElementSibling;
        if (!sibling || !sibling.classList.contains('placed-subject')) return;

        initialX = e.clientX;
        startWidth = elementToResize.offsetWidth;
        siblingStartWidth = sibling.offsetWidth;

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    }

    function handleResize(e) {
        const dx = e.clientX - initialX;
        const parentWidth = elementToResize.parentElement.offsetWidth;

        let newWidth = startWidth + dx;
        let newSiblingWidth = siblingStartWidth - dx;

        if (newWidth < 50 || newSiblingWidth < 50) return;

        const newWidthPercent = (newWidth / parentWidth) * 100;
        const newSiblingWidthPercent = (newSiblingWidth / parentWidth) * 100;

        const { day, slot } = elementToResize.dataset;
        const resizeIndex = parseInt(elementToResize.dataset.index);
        const siblingIndex = parseInt(sibling.dataset.index);

        schedule[day][slot][resizeIndex].width = newWidthPercent;
        schedule[day][slot][siblingIndex].width = newSiblingWidthPercent;

        renderSchedule();
    }

    function stopResize() {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        saveState();
        saveSchedule();
    }

    // --- START THE APP ---
    // Add mobile experience message
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobileDevice) {
        const mobileMessage = document.createElement('p');
        mobileMessage.style.cssText = "color: gray; text-align: center; margin-top: 20px;";
        mobileMessage.textContent = "التجربة على الكمبيوتر أفضل بكثير.";
        document.body.appendChild(mobileMessage);
    }

    init();
});

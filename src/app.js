document.addEventListener('DOMContentLoaded', () => {
    const state = {
        catalog: null,
        history: [],
        currentPath: '',
        activeTab: 'recent',
        searchQuery: ''
    };

    // DOM Elements
    const elements = {
        tabs: document.querySelectorAll('.tab-btn'),
        views: document.querySelectorAll('.view-panel'),
        loadingState: document.getElementById('loadingState'),
        errorState: document.getElementById('errorState'),
        emptyState: document.getElementById('emptyState'),
        emptyMessage: document.getElementById('emptyMessage'),
        recentList: document.getElementById('recentList'),
        folderList: document.getElementById('folderList'),
        breadcrumb: document.getElementById('breadcrumb'),
        searchInput: document.getElementById('searchInput'),
        clearSearch: document.getElementById('clearSearch'),
        searchToggle: document.getElementById('searchToggle'),
        searchRow: document.getElementById('searchRow'),
        themeToggle: document.getElementById('themeToggle'),
        langToggle: document.getElementById('langToggle'),
        langLabel: document.getElementById('langLabel'),
        folderBackBtn: document.getElementById('folderBackBtn'),
        aboutLink: document.getElementById('aboutLink'),
        aboutOverlay: document.getElementById('aboutOverlay'),
        aboutClose: document.getElementById('aboutClose'),
        notFoundOverlay: document.getElementById('notFoundOverlay')
    };

    // ===== I18N =====
    // Inline fallback (used if JSON fails to load)
    let I18N = {
        ar: {
            siteTitle: "اختبار - منصة الاختبارات", logoTitle: "اختبار", appName: "اختبار",
            searchPlaceholder: "ابحث عن الاختبارات أو التصنيفات...", recent: "الأخيرة", folders: "المجلدات",
            loading: "جاري تحميل الفهرس...", error: "تعذر تحميل الفهرس. تأكد من وجود ملف catalog.json.",
            noQuizzes: "لم يتم العثور على اختبارات بعد.", noResults: 'لم يتم العثور على نتائج لـ "{query}"',
            emptyFolder: "المجلد فارغ", emptyFolderDesc: "لا توجد اختبارات تطابق مسارك الحالي ومعايير البحث.",
            home: "الرئيسية", folder: "مجلد", at: "في", about: "مالك", search: "بحث", by: "بواسطة",
            toggleTheme: "تغيير المظهر", langSwitch: "English",
            authorName: "عباس عبد الرزاق", authorTitle: "مطور ومصمم واجهات",
            projectBio: "مشروع <b>اختبار</b> هو مبادرة تهدف لتسهيل عملية المراجعة والاختبار الذاتي للطلاب.",
            currentVersion: "الإصدار الحالي", launchYear: "تاريخ الإطلاق", backToPlatform: "العودة للمنصة",
            notFoundTitle: "الهدف مفقود",
            notFoundMsg: "تمت إزالة صفحة الاختبار التي تبحث عنها أو نقلها بواسطة المؤلف. لا تقلق، تقدمك في الفئات الأخرى آمن.",
            goHome: "العودة للمنصة"
        },
        en: {
            siteTitle: "Ikhtibar - Quiz Hub", logoTitle: "Ikhtibar", appName: "Ikhtibar",
            searchPlaceholder: "Search for quizzes or categories...", recent: "Recent", folders: "Folders",
            loading: "Loading catalog...", error: "Could not load catalog. Make sure catalog.json exists.",
            noQuizzes: "No quizzes found yet.", noResults: 'No results found for "{query}"',
            emptyFolder: "Folder is empty", emptyFolderDesc: "No quizzes match your current path and search criteria.",
            home: "Home", folder: "Folder", at: "at", about: "Author", search: "Search", by: "By",
            toggleTheme: "Toggle Theme", langSwitch: "العربية",
            authorName: "Abbas Abdul-Razzaq", authorTitle: "Developer & UI Designer",
            projectBio: "<b>Ikhtibar Project</b> is an initiative aimed at simplifying self-review and testing for students.",
            currentVersion: "Current Version", launchYear: "Launch Year", backToPlatform: "Back to Platform",
            notFoundTitle: "Page Not Found",
            notFoundMsg: "The quiz page you're looking for has been removed or moved by the author. Don't worry, your progress in other categories is safe.",
            goHome: "Return Home"
        }
    };

    let lang = localStorage.getItem('ikhtibar_lang') || 'ar';

    // Try loading external i18n JSON (overrides the inline fallback)
    (async function loadI18N() {
        try {
            // Try hub_i18n.json (in same folder or src/ folder)
            let response;
            try { response = await fetch('hub_i18n.json?t=' + Date.now()); } catch(e) {}
            if (!response || !response.ok) {
                try { response = await fetch('src/hub_i18n.json?t=' + Date.now()); } catch(e) {}
            }
            if (response && response.ok) {
                const data = await response.json();
                if (data.ar) I18N.ar = { ...I18N.ar, ...data.ar };
                if (data.en) I18N.en = { ...I18N.en, ...data.en };
                // Re-apply translations after loading
                updateLayout();
                translateStatic();
            }
        } catch(e) { /* Use inline fallback silently */ }
    })();

    // Translation helper
    const ht = (k, params = {}) => {
        let text = (I18N[lang] && I18N[lang][k]) || (I18N.ar && I18N.ar[k]) || k;
        for (const [p, v] of Object.entries(params)) {
            text = text.replace(`{${p}}`, v);
        }
        return text;
    };

    // ===== Layout & Translations =====
    function updateLayout() {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        if (elements.langLabel) elements.langLabel.innerText = ht('langSwitch');
        document.title = ht('siteTitle');

        const logoTitle = document.querySelector('.logo-area h1');
        if (logoTitle) logoTitle.innerText = ht('logoTitle');

        const footerTitle = document.querySelector('.app-name');
        if (footerTitle) footerTitle.innerText = ht('appName');
    }
    updateLayout();

    function translateStatic() {
        if (elements.searchInput) elements.searchInput.placeholder = ht('searchPlaceholder');

        const tabBtns = elements.tabs;
        if (tabBtns.length >= 2) {
            tabBtns[0].childNodes[2].textContent = '\n                ' + ht('recent') + '\n            ';
            tabBtns[1].childNodes[2].textContent = '\n                ' + ht('folders') + '\n            ';
        }

        const loadingP = elements.loadingState.querySelector('p');
        if (loadingP) loadingP.innerText = ht('loading');
        const errorP = elements.errorState.querySelector('p');
        if (errorP) errorP.innerText = ht('error');
        const emptyP = elements.emptyState.querySelector('p');
        if (emptyP) emptyP.innerText = ht('noQuizzes');

        const rootCrumb = elements.breadcrumb.querySelector('.root-crumb');
        if (rootCrumb) rootCrumb.childNodes[2].textContent = ' ' + ht('home');

        if (elements.aboutLink) elements.aboutLink.innerText = ht('about');
        if (elements.searchToggle) elements.searchToggle.title = ht('search');
        if (elements.themeToggle) elements.themeToggle.title = ht('toggleTheme');

        // About overlay
        const authorName = document.getElementById('authorName');
        if (authorName) authorName.innerText = ht('authorName');
        const authorBadge = document.getElementById('authorBadge');
        if (authorBadge) authorBadge.innerText = ht('about');

        // 404 overlay
        const nfTitle = document.getElementById('nfTitle');
        if (nfTitle) nfTitle.innerText = ht('notFoundTitle');
        const nfMsg = document.getElementById('nfMsg');
        if (nfMsg) nfMsg.innerText = ht('notFoundMsg');
        const nfHomeTxt = document.getElementById('nfHomeTxt');
        if (nfHomeTxt) nfHomeTxt.innerText = ht('goHome');
    }
    translateStatic();

    // Icons
    const ICONS = {
        folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
    };

    // ===== Initialize =====
    init();

    async function init() {
        setupTabs();
        setupSearch();
        setupLangToggle();
        setupTheme();
        setupAbout();
        check404();
        await fetchCatalog();
    }

    // ===== Theme =====
    function setupTheme() {
        // Force dark mode
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('ikhtibar_theme', 'dark');
    }

    // ===== Language =====
    function setupLangToggle() {
        if (elements.langToggle) {
            elements.langToggle.addEventListener('click', () => {
                lang = lang === 'ar' ? 'en' : 'ar';
                localStorage.setItem('ikhtibar_lang', lang);
                window.location.reload();
            });
        }
    }

    // ===== Search (Full-Width Row) =====
    function setupSearch() {
        if (!elements.searchInput || !elements.searchToggle || !elements.searchRow) return;

        elements.searchToggle.addEventListener('click', () => {
            elements.searchRow.classList.toggle('open');
            if (elements.searchRow.classList.contains('open')) {
                elements.searchInput.focus();
            }
        });

        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase().trim();
            if (elements.clearSearch) {
                elements.clearSearch.style.opacity = state.searchQuery ? '1' : '0';
            }
            renderCurrentState();
        });

        if (elements.clearSearch) {
            elements.clearSearch.addEventListener('click', (e) => {
                e.stopPropagation();
                elements.searchInput.value = '';
                state.searchQuery = '';
                elements.clearSearch.style.opacity = '0';
                elements.searchInput.focus();
                renderCurrentState();
            });
        }
    }

    // ===== About Overlay =====
    function setupAbout() {
        if (elements.aboutLink) {
            elements.aboutLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (elements.aboutOverlay) elements.aboutOverlay.classList.remove('hidden');
            });
        }
        if (elements.aboutClose) {
            elements.aboutClose.addEventListener('click', () => {
                if (elements.aboutOverlay) elements.aboutOverlay.classList.add('hidden');
            });
        }
        // Close on backdrop click
        if (elements.aboutOverlay) {
            elements.aboutOverlay.querySelector('.overlay-backdrop')?.addEventListener('click', () => {
                elements.aboutOverlay.classList.add('hidden');
            });
        }
    }

    // ===== 404 Check =====
    function check404() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') === '404') {
            if (elements.notFoundOverlay) elements.notFoundOverlay.classList.remove('hidden');
        }
        // Close on backdrop click
        if (elements.notFoundOverlay) {
            elements.notFoundOverlay.querySelector('.overlay-backdrop')?.addEventListener('click', () => {
                elements.notFoundOverlay.classList.add('hidden');
                history.replaceState(null, '', location.pathname);
            });
        }
    }

    // ===== Tabs =====
    function setupTabs() {
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;
                elements.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                elements.views.forEach(v => v.classList.remove('active'));
                document.getElementById(`${target}View`).classList.add('active');
                state.activeTab = target;
                renderCurrentState();
            });
        });
    }

    // ===== Data Loading =====
    async function fetchCatalog() {
        try {
            if (typeof IKHTIBAR_CATALOG !== 'undefined') {
                state.catalog = IKHTIBAR_CATALOG;
            } else {
                const response = await fetch('src/catalog.json?t=' + Date.now());
                state.catalog = await response.json();
            }

            if (typeof IKHTIBAR_HISTORY !== 'undefined') {
                state.history = IKHTIBAR_HISTORY;
            } else {
                try {
                    const hResponse = await fetch('src/history.json?t=' + Date.now());
                    state.history = await hResponse.json();
                } catch(e) {}
            }

            hideStates();
            renderCurrentState();
        } catch (error) {
            console.error('Failed to fetch catalog:', error);
            showState('error');
        }
    }

    // ===== Rendering =====
    function renderCurrentState() {
        if (!state.catalog || !state.catalog.files) return;
        hideStates();

        const filteredFiles = filterFiles(state.catalog.files);

        if (filteredFiles.length === 0) {
            if (state.searchQuery) {
                showState('empty', ht('noResults', { query: state.searchQuery }));
            } else {
                showState('empty', ht('noQuizzes'));
            }
            return;
        }

        if (state.activeTab === 'recent') {
            renderRecent(filteredFiles);
        } else {
            renderFolders(filteredFiles);
        }
    }

    function filterFiles(files) {
        if (!state.searchQuery) return files;
        return files.filter(file => {
            const title = (file.title || '').toLowerCase();
            const name = (file.name || '').toLowerCase();
            const path = (file.path || '').toLowerCase();
            const author = (file.author || '').toLowerCase();
            return title.includes(state.searchQuery) || name.includes(state.searchQuery) || path.includes(state.searchQuery) || author.includes(state.searchQuery);
        });
    }

    function renderRecent(files) {
        let displayFiles = [];
        if (state.searchQuery) {
            displayFiles = [...files].sort((a, b) => new Date(b.export_time || b.last_modified) - new Date(a.export_time || a.last_modified));
        } else if (state.history.length > 0) {
            displayFiles = state.history;
        } else {
            displayFiles = [...files].sort((a, b) => new Date(b.export_time || b.last_modified) - new Date(a.export_time || a.last_modified)).slice(0, 20);
        }
        elements.recentList.innerHTML = displayFiles.map(file => createFileCard(file)).join('');
    }

    function renderFolders(filteredFiles) {
        renderBreadcrumbs();

        // Show/Hide back button
        if (elements.folderBackBtn) {
            elements.folderBackBtn.style.display = state.currentPath ? 'flex' : 'none';
            if (!elements.folderBackBtn.dataset.bound) {
                elements.folderBackBtn.addEventListener('click', goBack);
                elements.folderBackBtn.dataset.bound = "true";
            }
        }

        const currentItems = getItemsInPath(state.currentPath, filteredFiles);
        const folders = currentItems.folders.sort();
        const files = currentItems.files.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));

        let html = '';
        folders.forEach(folder => {
            const fullPath = state.currentPath ? `${state.currentPath}/${folder}` : folder;
            html += createFolderCard(folder, fullPath);
        });
        files.forEach(file => { html += createFileCard(file, true); });

        if (folders.length === 0 && files.length === 0) {
            html = `<div style="text-align: center; color: var(--text-secondary); padding: 4rem 2rem; width: 100%;">
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">${ht('emptyFolder')}</div>
                <div style="font-size: 0.9rem; opacity: 0.6;">${ht('emptyFolderDesc')}</div>
            </div>`;
        }

        elements.folderList.innerHTML = html;

        document.querySelectorAll('.folder-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                state.currentPath = card.dataset.path;
                renderFolders(filteredFiles);
            });
        });
    }

    function goBack() {
        if (!state.currentPath) return;
        const parts = state.currentPath.split('/');
        parts.pop();
        state.currentPath = parts.join('/');
        renderCurrentState();
    }

    function getItemsInPath(targetPath, files) {
        const items = { folders: new Set(), files: [] };
        files.forEach(file => {
            const fileDir = file.path || '';
            if (targetPath === '') {
                if (fileDir === '') { items.files.push(file); }
                else {
                    const topFolder = fileDir.split('/')[0];
                    items.folders.add(topFolder);
                }
            } else {
                if (fileDir === targetPath) { items.files.push(file); }
                else if (fileDir.startsWith(targetPath + '/')) {
                    const remaining = fileDir.substring(targetPath.length + 1);
                    const nextFolder = remaining.split('/')[0];
                    if (nextFolder) items.folders.add(nextFolder);
                }
            }
        });
        return { folders: Array.from(items.folders), files: items.files };
    }

    function renderBreadcrumbs() {
        const parts = state.currentPath ? state.currentPath.split('/') : [];
        let html = `
            <button class="crumb-btn root-crumb" data-path="">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-bottom: -2px;">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                ${ht('home')}
            </button>
        `;

        let currentPath = '';
        parts.forEach((part) => {
            if (!part) return;
            currentPath += (currentPath ? '/' : '') + part;
            html += `<span class="crumb-separator">/</span>`;
            html += `<button class="crumb-btn" data-path="${currentPath}">${part}</button>`;
        });

        elements.breadcrumb.innerHTML = html;

        elements.breadcrumb.querySelectorAll('.crumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentPath = btn.dataset.path;
                renderCurrentState();
            });
        });
    }

    // ===== Card Builders =====
    function createFolderCard(name, fullPath) {
        return `
            <a href="#" class="bar-card folder-card" data-path="${fullPath}">
                <div class="folder-icon icon-circle">
                    ${ICONS.folder}
                </div>
                <div class="item-info">
                    <div class="item-title">${name}</div>
                    <div class="item-meta">${ht('folder')}</div>
                </div>
                <div class="item-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
            </a>
        `;
    }

    function safeBtoa(str) {
        try { return btoa(unescape(encodeURIComponent(str || ""))); } catch(e) { return ""; }
    }

    function getTitleKey(title) {
        return safeBtoa(title).substring(0, 16);
    }

    function getQuizProgressInfo(file) {
        const titleKey = getTitleKey(file.title || file.name);
        const qCount = file.questionCount || 0;
        
        let status = 'not_started'; // 'not_started' | 'in_progress' | 'completed'
        let detailText = '';
        let badgeClass = 'status-not-started';
        let badgeText = lang === 'ar' ? 'لم يبدأ' : 'Not Started';

        if (file.isListMode) {
            const cats = file.categories || [];
            const catCount = cats.length;
            let completedCats = 0;
            let inProgressCats = 0;
            
            for (let i = 0; i < catCount; i++) {
                const catBest = localStorage.getItem("amosha_cat_best_" + titleKey + "_" + i);
                if (catBest !== null) {
                    completedCats++;
                } else {
                    const catProg = localStorage.getItem("amosha_progress_" + titleKey + "_cat_" + i);
                    if (catProg !== null) {
                        inProgressCats++;
                    }
                }
            }
            
            if (completedCats === catCount && catCount > 0) {
                status = 'completed';
                badgeClass = 'status-completed';
                badgeText = lang === 'ar' ? 'اكتمل الكل' : 'Completed All';
                detailText = lang === 'ar' ? `اكتمل ${completedCats}/${catCount} محاضرة` : `Completed ${completedCats}/${catCount} Lectures`;
            } else if (completedCats > 0 || inProgressCats > 0) {
                status = 'in_progress';
                badgeClass = 'status-in-progress';
                badgeText = lang === 'ar' ? 'قيد التقدم' : 'In Progress';
                detailText = lang === 'ar' ? `تقدم: ${completedCats} مكتمل، ${inProgressCats} مستمر` : `Progress: ${completedCats} completed, ${inProgressCats} active`;
            } else {
                detailText = '';
            }
        } else {
            // Single file quiz
            const bestScore = localStorage.getItem("amosha_cat_best_" + titleKey + "_global");
            const progressStr = localStorage.getItem("amosha_progress_" + titleKey + "_0");
            
            if (bestScore !== null) {
                status = 'completed';
                badgeClass = 'status-completed';
                badgeText = lang === 'ar' ? `أفضل نتيجة: ${bestScore}%` : `Best: ${bestScore}%`;
            } else if (progressStr !== null) {
                status = 'in_progress';
                badgeClass = 'status-in-progress';
                badgeText = lang === 'ar' ? 'قيد التقدم' : 'In Progress';
                
                try {
                    const prog = JSON.parse(progressStr);
                    if (prog && prog.selections) {
                        const answered = Object.keys(prog.selections).length;
                        detailText = lang === 'ar' ? `تمت الإجابة ${answered}/${qCount}` : `Answered ${answered}/${qCount}`;
                    }
                } catch(e) {}
            }
        }
        
        // Build question text
        let qText = '';
        if (qCount > 0) {
            if (file.isListMode) {
                const catCount = (file.categories || []).length;
                qText = lang === 'ar' ? 
                    `${qCount} سؤال (${catCount} محاضرة)` : 
                    `${qCount} Questions (${catCount} Lectures)`;
            } else {
                qText = lang === 'ar' ? 
                    `${qCount} سؤال` : 
                    `${qCount} Questions`;
            }
        }
        
        return {
            status,
            badgeClass,
            badgeText,
            detailText,
            qText
        };
    }

    function createFileCard(file, isBars = false) {
        const dateStr = file.export_time || file.last_modified;
        const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
        const date = new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
        const time = new Date(dateStr).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        const fileUrl = file.full_path + '?lang=' + lang;
        const title = file.title || file.name;
        
        const prog = getQuizProgressInfo(file);

        if (isBars) {
            return `
                <a href="${fileUrl}" class="bar-card file-card">
                    <div class="card-body">
                        <div class="card-row-title">
                            <div class="icon-circle">
                                ${ICONS.file}
                            </div>
                            <div class="item-title">${title}</div>
                        </div>
                        <div class="card-row-meta">
                            <span class="quiz-status-badge ${prog.badgeClass}">${prog.badgeText}</span>
                            <span class="card-date">${date} ${ht('at')} ${time}</span>
                            ${file.author ? `<span class="quiz-author-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="opacity:0.7"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${file.author}</span>` : ''}
                            ${prog.qText ? `<span class="quiz-qcount-chip">${prog.qText}</span>` : ''}
                            ${prog.detailText ? `<span class="quiz-detail-text">${prog.detailText}</span>` : ''}
                        </div>
                        ${file.path ? `
                        <div class="card-row-location">
                            <span class="path-chip">${file.path}</span>
                        </div>` : ''}
                    </div>
                    <div class="item-action">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </a>
            `;
        }

        return `
            <a href="${fileUrl}" class="row-card item-card">
                <div class="card-body">
                    <div class="card-row-title">
                        <div class="icon-circle">
                            ${ICONS.file}
                        </div>
                        <div class="item-title">${title}</div>
                    </div>
                    <div class="card-row-meta">
                        <span class="quiz-status-badge ${prog.badgeClass}">${prog.badgeText}</span>
                        <span class="card-date">${date} ${ht('at')} ${time}</span>
                        ${file.author ? `<span class="quiz-author-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="opacity:0.7"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${file.author}</span>` : ''}
                        ${prog.qText ? `<span class="quiz-qcount-chip">${prog.qText}</span>` : ''}
                        ${prog.detailText ? `<span class="quiz-detail-text">${prog.detailText}</span>` : ''}
                    </div>
                    ${file.path ? `
                    <div class="card-row-location">
                        <span class="path-chip">${file.path}</span>
                    </div>` : ''}
                </div>
                <div class="item-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="24" height="24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
            </a>
        `;
    }

    // ===== State Management =====
    function showState(stateName, message) {
        hideStates();
        elements.recentList.innerHTML = '';
        elements.folderList.innerHTML = '';
        if (stateName === 'loading') elements.loadingState.classList.remove('hidden');
        if (stateName === 'error') elements.errorState.classList.remove('hidden');
        if (stateName === 'empty') {
            elements.emptyState.classList.remove('hidden');
            if (message && elements.emptyMessage) elements.emptyMessage.innerText = message;
        }
    }

    function hideStates() {
        elements.loadingState.classList.add('hidden');
        elements.errorState.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
    }
});

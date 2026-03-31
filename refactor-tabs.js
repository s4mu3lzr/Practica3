const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/pages/group-manage/group-manage.html');
let content = fs.readFileSync(filePath, 'utf8');

const headerSearch = `    <!-- HEADER -->
    <div class="flex justify-content-between align-items-start mb-4">
        <div>
            <div class="flex align-items-center gap-2 mb-2">
                <a routerLink="/group" pButton icon="pi pi-arrow-left"
                    class="p-button-rounded p-button-text p-button-secondary"></a>
                <h1 class="text-3xl font-bold m-0 text-gray-800">{{ group?.name || 'Cargando...' }}</h1>
            </div>
            <p class="text-gray-500 m-0 ml-5">{{ group?.description }}</p>
        </div>
        <p-tag [value]="members.length + ' Integrantes'" severity="info"></p-tag>
    </div>

    <!-- TABS -->
    <p-tabs value="0">
        <p-tablist>
            <p-tab value="0"><i class="pi pi-chart-bar mr-2"></i>Dashboard</p-tab>
            <p-tab value="1"><i class="pi pi-users mr-2"></i>Integrantes</p-tab>
            <p-tab value="2"><i class="pi pi-table mr-2"></i>Tickets</p-tab>
        </p-tablist>`;

const headerReplace = `    <!-- HEADER -->
    <div class="flex justify-content-between align-items-start mb-4">
        <div>
            <div class="flex align-items-center gap-2 mb-2">
                <a routerLink="/group" pButton icon="pi pi-arrow-left"
                    class="p-button-rounded p-button-text p-button-secondary"></a>
                <h1 class="text-3xl font-bold m-0 text-gray-800">{{ group?.name || 'Cargando...' }}</h1>
            </div>
            <p class="text-gray-500 m-0 ml-5">{{ group?.description }}</p>

            <div class="flex flex-wrap gap-3 mt-3 ml-5">
                <div class="flex align-items-center gap-2 bg-blue-50 text-blue-600 border-round-lg p-2 px-3">
                    <span class="text-2xl font-bold">{{ groupKpis.total }}</span>
                    <span class="text-sm font-medium">Total</span>
                </div>
                <div class="flex align-items-center gap-2 bg-orange-50 text-orange-600 border-round-lg p-2 px-3">
                    <span class="text-2xl font-bold">{{ groupKpis.pendiente }}</span>
                    <span class="text-sm font-medium">Pendientes</span>
                </div>
                <div class="flex align-items-center gap-2 bg-cyan-50 text-cyan-600 border-round-lg p-2 px-3">
                    <span class="text-2xl font-bold">{{ groupKpis.enProgreso }}</span>
                    <span class="text-sm font-medium">En Progreso</span>
                </div>
                <div class="flex align-items-center gap-2 bg-green-50 text-green-600 border-round-lg p-2 px-3">
                    <span class="text-2xl font-bold">{{ groupKpis.hechos }}</span>
                    <span class="text-sm font-medium">Hechos</span>
                </div>
            </div>
        </div>
        <p-tag [value]="members.length + ' Integrantes'" severity="info"></p-tag>
    </div>

    <!-- TABS -->
    <p-tabs value="0">
        <p-tablist>
            <p-tab value="0"><i class="pi pi-table mr-2"></i>Tickets</p-tab>
            <p-tab value="1"><i class="pi pi-users mr-2"></i>Integrantes</p-tab>
        </p-tablist>`;

if (content.indexOf(headerSearch) === -1) {
    console.error("Header search block not found!");
    process.exit(1);
}

content = content.replace(headerSearch, headerReplace);

const tab1Regex = /<!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \s*TAB 1: INTEGRANTES \s*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->\s*<p-tabpanel value="1">([\s\S]*?)<\/p-tabpanel>/;
const tab2Regex = /<!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \s*TAB 2: TICKETS \s*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->\s*<p-tabpanel value="2">([\s\S]*?)<\/p-tabpanel>\s*<\/p-tabpanels>/;

const tab1Match = content.match(tab1Regex);
const tab2Match = content.match(tab2Regex);

if (!tab1Match) { console.error("Tab 1 not found"); process.exit(1); }
if (!tab2Match) { console.error("Tab 2 not found"); process.exit(1); }

const tab1Content = tab1Match[1];
const tab2Content = tab2Match[1];

const newTabPanels = `        <p-tabpanels>
            <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                 TAB 0: TICKETS 
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->
            <p-tabpanel value="0">${tab2Content}</p-tabpanel>

            <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                 TAB 1: INTEGRANTES 
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->
            <p-tabpanel value="1">${tab1Content}</p-tabpanel>
        </p-tabpanels>`;

const startIdx = content.indexOf('<p-tabpanels>');
const endIdx = content.indexOf('</p-tabpanels>') + '</p-tabpanels>'.length;

const finalContent = content.substring(0, startIdx) + newTabPanels + content.substring(endIdx);

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log("HTML Refactored Successfully!");

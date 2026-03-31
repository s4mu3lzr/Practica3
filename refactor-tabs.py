import sys
import re

file_path = 'src/app/pages/group-manage/group-manage.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Header and Tabs List
header_search = """    <!-- HEADER -->
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
        </p-tablist>"""

header_replace = """    <!-- HEADER -->
    <div class="flex justify-content-between align-items-start mb-4">
        <div>
            <div class="flex align-items-center gap-2 mb-2">
                <a routerLink="/group" pButton icon="pi pi-arrow-left"
                    class="p-button-rounded p-button-text p-button-secondary"></a>
                <h1 class="text-3xl font-bold m-0 text-gray-800">{{ group?.name || 'Cargando...' }}</h1>
            </div>
            <p class="text-gray-500 m-0 ml-5">{{ group?.description }}</p>

            <!-- KPIs Header -->
            <div class="flex flex-wrap gap-3 mt-3 ml-5">
                <div class="flex align-items-center gap-2 bg-blue-50 text-blue-600 border-round-lg p-2 px-3 hover:shadow-1 transition-all">
                    <span class="text-2xl font-bold">{{ groupKpis.total }}</span>
                    <span class="text-sm font-medium">Total</span>
                </div>
                <div class="flex align-items-center gap-2 bg-orange-50 text-orange-600 border-round-lg p-2 px-3 hover:shadow-1 transition-all">
                    <span class="text-2xl font-bold">{{ groupKpis.pendiente }}</span>
                    <span class="text-sm font-medium">Pendientes</span>
                </div>
                <div class="flex align-items-center gap-2 bg-cyan-50 text-cyan-600 border-round-lg p-2 px-3 hover:shadow-1 transition-all">
                    <span class="text-2xl font-bold">{{ groupKpis.enProgreso }}</span>
                    <span class="text-sm font-medium">En Progreso</span>
                </div>
                <div class="flex align-items-center gap-2 bg-green-50 text-green-600 border-round-lg p-2 px-3 hover:shadow-1 transition-all">
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
        </p-tablist>"""

if header_search not in content:
    print("Header search block not found!")
    sys.exit(1)

content = content.replace(header_search, header_replace)

# Match TAB 1 contents
tab1_match = re.search(r'<!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \s*TAB 1: INTEGRANTES \s*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->\s*<p-tabpanel value="1">(.*?)</p-tabpanel>', content, re.DOTALL)
if not tab1_match:
    print("Could not find TAB 1")
    sys.exit(1)
tab1_content = tab1_match.group(1)

# Match TAB 2 contents
tab2_match = re.search(r'<!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \s*TAB 2: TICKETS \s*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->\s*<p-tabpanel value="2">(.*?)</p-tabpanel>\s*</p-tabpanels>', content, re.DOTALL)
if not tab2_match:
    print("Could not find TAB 2")
    sys.exit(1)
tab2_content = tab2_match.group(1)

new_tabpanels = f"""        <p-tabpanels>
            <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                 TAB 0: TICKETS 
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->
            <p-tabpanel value="0">{tab2_content}</p-tabpanel>

            <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                 TAB 1: INTEGRANTES 
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->
            <p-tabpanel value="1">{tab1_content}</p-tabpanel>
        </p-tabpanels>"""

# Replace the entire <p-tabpanels> block
start_idx = content.find('<p-tabpanels>')
end_idx = content.find('</p-tabpanels>') + len('</p-tabpanels>')

final_content = content[:start_idx] + new_tabpanels + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("HTML Refactored Successfully!")

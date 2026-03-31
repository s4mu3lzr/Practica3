const fs = require('fs');
let lines = fs.readFileSync('src/app/pages/group-manage/group-manage.html', 'utf8').split(/\r?\n/);
lines.splice(40, 71); // Lines shifted by 14 due to Header replacements (26 + 14 = 40)
fs.writeFileSync('src/app/pages/group-manage/group-manage.html', lines.join('\n'), 'utf8');

const fs = require('fs');
const file = 'member.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('8.10.0/firebase-app.js')) {
        content = content.replace('8.10.0/firebase-app.js', '10.8.0/firebase-app-compat.js');
        changed = true;
    }
    if (content.includes('8.10.0/firebase-auth.js')) {
        content = content.replace('8.10.0/firebase-auth.js', '10.8.0/firebase-auth-compat.js');
        changed = true;
    }
    if (content.includes('8.10.0/firebase-database.js')) {
        content = content.replace('8.10.0/firebase-database.js', '10.8.0/firebase-database-compat.js');
        changed = true;
    }
    if (content.includes('8.10.0/firebase-storage.js')) {
        content = content.replace('8.10.0/firebase-storage.js', '10.8.0/firebase-storage-compat.js');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Firebase SDK versions synced in member.html');
    } else {
        console.log('No Firebase SDK v8 changes needed in member.html');
    }
}

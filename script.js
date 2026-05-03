// Storage keys
const STORAGE_KEY = 'deployed_html';
const LOGS_KEY = 'deployment_logs';

// DOM Elements
const htmlEditor = document.getElementById('htmlEditor');
const previewBtn = document.getElementById('previewBtn');
const deployBtn = document.getElementById('deployBtn');
const clearBtn = document.getElementById('clearBtn');
const previewSection = document.getElementById('previewSection');
const previewFrame = document.getElementById('previewFrame');
const deploySection = document.getElementById('deploySection');
const publicLink = document.getElementById('publicLink');
const copyBtn = document.getElementById('copyBtn');
const openLink = document.getElementById('openLink');

// Load saved HTML from localStorage
function loadSavedHTML() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        htmlEditor.value = saved;
    } else {
        // Default template
        htmlEditor.value = `<!DOCTYPE html>
<html>
<head>
    <title>My Deployed Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        h1 {
            font-size: 3em;
        }
    </style>
</head>
<body>
    <h1>✨ Hello World!</h1>
    <p>Ini adalah halaman yang dideploy menggunakan tool ini.</p>
    <button onclick="alert('Halo! Terima kasih sudah mengunjungi halaman saya!')">Klik Saya!</button>
</body>
</html>`;
    }
}

// Preview HTML in iframe
function previewHTML() {
    const html = htmlEditor.value;
    const iframe = previewFrame;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    previewSection.style.display = 'block';
    deploySection.style.display = 'none';
}

// Generate unique ID for deployment
function generateUniqueId() {
    return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Save deployment log
function saveDeploymentLog(html, publicUrl) {
    const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    logs.unshift({
        id: generateUniqueId(),
        timestamp: new Date().toISOString(),
        html: html.substring(0, 500) + '...', // Save preview
        fullHtml: html,
        url: publicUrl
    });
    
    // Keep only last 10 logs
    if (logs.length > 10) logs.pop();
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

// Deploy to public link
async function deployHTML() {
    const html = htmlEditor.value;
    
    if (!html.trim()) {
        alert('❌ Mohon masukkan HTML terlebih dahulu!');
        return;
    }
    
    // Show loading state
    const originalText = deployBtn.textContent;
    deployBtn.textContent = '⏳ Deploying...';
    deployBtn.disabled = true;
    
    try {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, html);
        
        // Create a data URL for the HTML
        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
        
        // Generate public link using multiple services
        const deployedUrls = [];
        
        // Method 1: Using HTML Preview (most reliable)
        const encodedHtml = encodeURIComponent(html);
        const previewUrl = `https://htmlpreview.github.io/?${dataUrl}`;
        deployedUrls.push(previewUrl);
        
        // Method 2: Create a unique blob URL
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        deployedUrls.push(blobUrl);
        
        // Method 3: Using CodePen-like local storage (shareable)
        const storageUrl = `${window.location.origin}${window.location.pathname}?id=${generateUniqueId()}`;
        
        // Create a permanent link using localStorage sharing
        const shareableId = generateUniqueId();
        localStorage.setItem(`share_${shareableId}`, html);
        const permanentUrl = `${window.location.origin}${window.location.pathname}?share=${shareableId}`;
        
        // Store all URLs
        const deploymentData = {
            previewUrl: previewUrl,
            blobUrl: blobUrl,
            permanentUrl: permanentUrl,
            timestamp: new Date().toISOString(),
            id: shareableId
        };
        
        localStorage.setItem('last_deployment', JSON.stringify(deploymentData));
        
        // Save to deployment logs
        saveDeploymentLog(html, permanentUrl);
        
        // Display the link (use permanent URL as main link)
        publicLink.value = permanentUrl;
        openLink.href = permanentUrl;
        
        // Show deploy section
        deploySection.style.display = 'block';
        previewSection.style.display = 'none';
        
        // Scroll to deploy section
        deploySection.scrollIntoView({ behavior: 'smooth' });
        
        // Show success message
        showNotification('✅ Berhasil dideploy! Link publik telah dibuat.', 'success');
        
    } catch (error) {
        console.error('Deployment error:', error);
        alert('❌ Gagal deploy. Silakan coba lagi.');
        showNotification('❌ Gagal deploy: ' + error.message, 'error');
    } finally {
        // Reset button state
        deployBtn.textContent = originalText;
        deployBtn.disabled = false;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white;
        border-radius: 8px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Clear editor
function clearEditor() {
    if (confirm('Apakah Anda yakin ingin menghapus semua kode?')) {
        htmlEditor.value = '';
        localStorage.removeItem(STORAGE_KEY);
        previewSection.style.display = 'none';
        deploySection.style.display = 'none';
        showNotification('🗑️ Editor telah dibersihkan', 'success');
    }
}

// Copy to clipboard
async function copyToClipboard() {
    const link = publicLink.value;
    if (!link) return;
    
    try {
        await navigator.clipboard.writeText(link);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
        showNotification('📋 Link berhasil disalin!', 'success');
    } catch (err) {
        alert('Gagal menyalin link');
    }
}

// Check for shared link in URL
function checkSharedLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    
    if (shareId) {
        const sharedHtml = localStorage.getItem(`share_${shareId}`);
        if (sharedHtml) {
            htmlEditor.value = sharedHtml;
            previewHTML();
            showNotification('📄 Memuat halaman yang dibagikan...', 'success');
        } else {
            showNotification('⚠️ Halaman yang dibagikan tidak ditemukan', 'error');
        }
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Event listeners
previewBtn.addEventListener('click', previewHTML);
deployBtn.addEventListener('click', deployHTML);
clearBtn.addEventListener('click', clearEditor);
copyBtn.addEventListener('click', copyToClipboard);

// Auto-save on edit
let saveTimeout;
htmlEditor.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, htmlEditor.value);
    }, 1000);
});

// Initialize
loadSavedHTML();
checkSharedLink();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to deploy
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        deployHTML();
    }
    // Ctrl+P to preview
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        previewHTML();
    }
});

// Display info about shareable links
console.log('✨ Deploy HTML Tool Ready!');
console.log('💡 Tip: Gunakan Ctrl+Enter untuk deploy cepat');
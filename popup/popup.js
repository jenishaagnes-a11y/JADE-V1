class PopupManager {
    constructor() {
        this.currentTab = null;
        this.currentDomain = null;
        this.currentPolicy = null;
        this.isInitialized = false;
        this.catState = 'happy';
        
        this.init();
    }
    openDashboard() {
    // Open dashboard in a new tab
    chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard/dashboard.html')
    });
    
    // Close popup
    window.close();
}
    async init() {
        // Get current tab
        await this.getCurrentTab();
        
        // Load current domain policy
        await this.loadCurrentPolicy();
        
        // Load recent blocks
        await this.loadRecentBlocks();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup interactive cat
        this.setupInteractiveCat();
        this.enhanceCatTooltip();
        
        // Update UI
        this.updateUI();
        
        this.isInitialized = true;
        console.log('Popup initialized for domain:', this.currentDomain);
    }
    
    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
            this.currentDomain = this.extractDomain(tab.url);
            return tab;
        } catch (error) {
            console.error('Failed to get current tab:', error);
            return null;
        }
    }
    
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (e) {
            return 'unknown';
        }
    }
    
    async loadCurrentPolicy() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_POLICY',
                domain: this.currentDomain
            });
            
            if (response.success) {
                this.currentPolicy = response.policy;
                return this.currentPolicy;
            }
        } catch (error) {
            console.error('Failed to load policy:', error);
        }
        return null;
    }
    
    async loadRecentBlocks() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_LOGS',
                limit: 10
            });
            
            if (response.success) {
                this.recentBlocks = response.logs.filter(log => 
                    log.action === 'blocked' && log.domain === this.currentDomain
                ).slice(0, 5);
                return this.recentBlocks;
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
        return [];
    }
    
    setupEventListeners() {
        // Policy toggles
        const toggleIds = [
            'allowNetwork', 'allowStorage', 'allowCookies',
            'allowGeolocation', 'allowCamera', 'allowMicrophone',
            'allowDOM', 'allowNotifications', 'allowClipboard'
        ];
        
        toggleIds.forEach(id => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.addEventListener('change', () => this.onPolicyToggle(id));
            }
        document.getElementById('openDashboard').addEventListener('click', () => 
            this.openDashboard());

        });
        
        // Buttons
        document.getElementById('applyBtn').addEventListener('click', () => this.applyPolicy());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetPolicy());
        document.getElementById('lockdownBtn').addEventListener('click', () => this.enableLockdown());
        document.getElementById('whitelistBtn').addEventListener('click', () => this.whitelistSite());
        document.getElementById('viewLogsBtn').addEventListener('click', () => this.openOptions('logs'));
        document.getElementById('optionsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.openOptions();
        });
        document.getElementById('settingsBtn').addEventListener('click', () => this.openOptions('settings'));
    }
    
    setupInteractiveCat() {
        const catIndicator = document.getElementById('catIndicator');
        if (!catIndicator) return;
        
        // Cat reacts to clicks
        catIndicator.addEventListener('click', () => {
            this.showCatMessage();
            this.animateCatClick();
        });
        
        // Cat reacts to hover
        catIndicator.addEventListener('mouseenter', () => {
            this.animateCatHover();
        });
        
        catIndicator.addEventListener('mouseleave', () => {
            this.resetCatAnimation();
        });
    }
    
    animateCatHover() {
        const catFace = document.getElementById('catFace');
        if (!catFace) return;
        
        // Add subtle bounce on hover
        catFace.style.transform = 'scale(1.05)';
        
        // Twitch ears on hover
        const ears = catFace.querySelectorAll('.ear');
        ears.forEach(ear => {
            ear.style.animation = 'earTwitch 0.3s ease-in-out';
        });
        
        // Wider eyes on hover
        const eyes = catFace.querySelectorAll('.eye');
        eyes.forEach(eye => {
            eye.style.transform = 'scaleX(1.2)';
        });
    }
    
    animateCatClick() {
        const catFace = document.getElementById('catFace');
        if (!catFace) return;
        
        // Play click animation based on current state
        switch(this.catState) {
            case 'happy':
                catFace.style.animation = 'happyFloat 0.5s ease-in-out';
                break;
            case 'neutral':
                catFace.style.animation = 'neutralSway 0.5s ease-in-out';
                break;
            case 'angry':
                catFace.style.animation = 'angryShake 0.5s ease-in-out';
                break;
        }
        
        // Reset animation after it plays
        setTimeout(() => {
            this.updateCatFaceAnimation();
        }, 500);
    }
    
    resetCatAnimation() {
        const catFace = document.getElementById('catFace');
        if (!catFace) return;
        
        catFace.style.transform = 'scale(1)';
        
        const ears = catFace.querySelectorAll('.ear');
        ears.forEach(ear => {
            ear.style.animation = '';
        });
        
        const eyes = catFace.querySelectorAll('.eye');
        eyes.forEach(eye => {
            eye.style.transform = '';
        });
    }
    
    enhanceCatTooltip() {
        const catIndicator = document.getElementById('catIndicator');
        if (!catIndicator) return;
        
        // Create custom tooltip
        catIndicator.addEventListener('mouseenter', (e) => {
            const rect = catIndicator.getBoundingClientRect();
            const tooltip = document.createElement('div');
            tooltip.className = 'cat-tooltip';
            tooltip.textContent = 'Click me for safety advice!';
            tooltip.style.cssText = `
                position: fixed;
                top: ${rect.top - 35}px;
                left: ${rect.left - 20}px;
                background: #2d3748;
                color: white;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 11px;
                white-space: nowrap;
                z-index: 10000;
                animation: tooltipFade 0.2s ease;
                font-weight: 500;
            `;
            
            tooltip.id = 'catTooltip';
            document.body.appendChild(tooltip);
            
            // Add arrow
            const arrow = document.createElement('div');
            arrow.style.cssText = `
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 6px solid transparent;
                border-top-color: #2d3748;
            `;
            tooltip.appendChild(arrow);
        });
        
        catIndicator.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('catTooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    }
    
    updateUI() {
        // Update domain info
        document.getElementById('currentDomain').textContent = this.currentDomain;
        document.getElementById('currentUrl').textContent = this.currentTab?.url || '...';
        
        // Update policy toggles
        if (this.currentPolicy) {
            const policyMap = {
                'allowNetwork': 'allowNetwork',
                'allowStorage': 'allowStorage',
                'allowCookies': 'allowCookies',
                'allowGeolocation': 'allowGeolocation',
                'allowCamera': 'allowCamera',
                'allowMicrophone': 'allowMicrophone',
                'allowDOM': 'allowDOM',
                'allowNotifications': 'allowNotifications',
                'allowClipboard': 'allowClipboard'
            };
            
            for (const [toggleId, policyKey] of Object.entries(policyMap)) {
                const toggle = document.getElementById(toggleId);
                if (toggle) {
                    toggle.checked = !!this.currentPolicy[policyKey];
                }
            }
            
            // Update risk score and cat face
            this.updateRiskScore();
        }
        
        // Update recent blocks
        this.updateRecentBlocks();
        
        // Update block count
        this.updateBlockCount();
    }
    
    async updateRiskScore() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_LOGS',
                limit: 100
            });
            
            if (response.success) {
                const logs = response.logs.filter(log => log.domain === this.currentDomain);
                const blockedCount = logs.filter(log => log.action === 'blocked').length;
                const allowedCount = logs.filter(log => log.action === 'allowed').length;
                const total = blockedCount + allowedCount;
                
                let riskScore = 50; // Default
                if (total > 0) {
                    riskScore = Math.round((blockedCount / total) * 100);
                }
                
                const riskElement = document.getElementById('riskScore');
                riskElement.textContent = riskScore;
                riskElement.className = 'risk-value';
                
                // Update risk color
                if (riskScore <= 30) {
                    riskElement.classList.add('low');
                } else if (riskScore <= 70) {
                    riskElement.classList.add('medium');
                } else {
                    riskElement.classList.add('high');
                }
                
                // Update cat face
                this.updateCatFace(riskScore);
            }
        } catch (error) {
            console.error('Failed to update risk score:', error);
        }
    }
    
    updateCatFace(riskScore) {
        const catFace = document.getElementById('catFace');
        
        if (!catFace) return;
        
        // Remove all existing classes
        catFace.className = 'cat-face';
        
        // Set face and class based on risk
        if (riskScore <= 30) {
            catFace.classList.add('happy');
            this.catState = 'happy';
            catFace.title = "😺 Purrfect! This site is safe!";
        } else if (riskScore <= 70) {
            catFace.classList.add('neutral');
            this.catState = 'neutral';
            catFace.title = "😼 Meow... This site is suspicious.";
        } else {
            catFace.classList.add('angry');
            this.catState = 'angry';
            catFace.title = "😾 HISS! This site is dangerous!";
        }
        
        // Update animation
        this.updateCatFaceAnimation();
    }
    
    updateCatFaceAnimation() {
        const catFace = document.getElementById('catFace');
        if (!catFace) return;
        
        // Remove any existing animation
        catFace.style.animation = '';
        
        // Set new animation based on state
        switch(this.catState) {
            case 'happy':
                catFace.style.animation = 'happyFloat 3s ease-in-out infinite';
                break;
            case 'neutral':
                catFace.style.animation = 'neutralSway 4s ease-in-out infinite';
                break;
            case 'angry':
                catFace.style.animation = 'angryShake 0.5s ease-in-out infinite';
                break;
        }
    }
    
    showCatMessage() {
        const riskScore = parseInt(document.getElementById('riskScore').textContent) || 50;
        const messages = {
            low: [
                "😺 Purrfect! Everything looks safe here!",
                "😺 This site is as clean as a freshly licked paw!",
                "😺 Meow! No suspicious activity detected!",
                "😺 This site gets my paw of approval! 🐾",
                "😺 Safe to browse! My whiskers aren't twitching at all!"
            ],
            medium: [
                "😼 Hmm... Some fishy business going on here.",
                "😼 Keep an eye on this one, human.",
                "😼 I've seen worse, but stay alert.",
                "😼 This site is on thin ice... or should I say thin mice? 🐭",
                "😼 My tail is twitching... something's not quite right."
            ],
            high: [
                "😾 HISS! Get away from this dangerous site!",
                "😾 Warning! This site is more suspicious than a cat in a yarn shop!",
                "😾 Red alert! Don't trust this site!",
                "😾 This site is bad news! My fur is standing on end! 🐾",
                "😾 Danger! This site is trying to steal your data!"
            ]
        };
        
        let category = 'medium';
        if (riskScore <= 30) category = 'low';
        else if (riskScore >= 70) category = 'high';
        
        const randomMessage = messages[category][Math.floor(Math.random() * messages[category].length)];
        
        // Create cute cat notification
        const notification = document.createElement('div');
        notification.className = 'cat-notification';
        notification.innerHTML = `
            <div class="cat-speech">${randomMessage}</div>
            <div class="cat-paw">🐾</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.98);
            padding: 20px;
            border-radius: 15px;
            border: 2px solid #667eea;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: catPop 0.3s ease;
            max-width: 280px;
            text-align: center;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(notification);
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes catPop {
                from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            .cat-paw {
                animation: pawWave 1.5s ease-in-out infinite;
            }
            @keyframes pawWave {
                0%, 100% { transform: rotate(0deg) scale(1); }
                25% { transform: rotate(-20deg) scale(1.2); }
                50% { transform: rotate(0deg) scale(1); }
                75% { transform: rotate(20deg) scale(1.2); }
            }
        `;
        document.head.appendChild(style);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'OK';
        closeBtn.style.cssText = `
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            margin-top: 10px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = '#764ba2';
        closeBtn.onmouseout = () => closeBtn.style.background = '#667eea';
        closeBtn.onclick = () => {
            notification.remove();
            style.remove();
        };
        
        notification.querySelector('.cat-paw').after(closeBtn);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'catPop 0.3s ease reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                    if (style.parentNode) {
                        style.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    updateRecentBlocks() {
        const container = document.getElementById('recentBlocksList');
        
        if (!this.recentBlocks || this.recentBlocks.length === 0) {
            container.innerHTML = '<div class="empty-state">No blocks detected yet</div>';
            return;
        }
        
        container.innerHTML = this.recentBlocks.map(block => `
            <div class="block-item">
                <div class="block-api">${block.api}</div>
                <div class="block-reason">${block.userMessage || block.reason || 'Blocked by policy'}</div>
                <div class="block-time">${this.formatTime(block.timestamp)}</div>
            </div>
        `).join('');
    }
    
    async updateBlockCount() {
        try {
            const today = new Date().setHours(0, 0, 0, 0);
            const response = await chrome.runtime.sendMessage({
                type: 'GET_LOGS',
                limit: 1000
            });
            
            if (response.success) {
                const todayBlocks = response.logs.filter(log => 
                    log.action === 'blocked' && 
                    new Date(log.timestamp) >= today
                ).length;
                
                document.getElementById('blockCount').textContent = todayBlocks;
            }
        } catch (error) {
            console.error('Failed to update block count:', error);
        }
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    }
    
    onPolicyToggle(toggleId) {
        console.log(`Policy toggle changed: ${toggleId}`);
        // Real-time visual feedback
        const toggle = document.getElementById(toggleId);
        toggle.parentElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            toggle.parentElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    async applyPolicy() {
        try {
            // Get current toggle values
            const policy = {
                allowNetwork: document.getElementById('allowNetwork').checked,
                allowStorage: document.getElementById('allowStorage').checked,
                allowCookies: document.getElementById('allowCookies').checked,
                allowGeolocation: document.getElementById('allowGeolocation').checked,
                allowCamera: document.getElementById('allowCamera').checked,
                allowMicrophone: document.getElementById('allowMicrophone').checked,
                allowDOM: document.getElementById('allowDOM').checked,
                allowNotifications: document.getElementById('allowNotifications').checked,
                allowClipboard: document.getElementById('allowClipboard').checked,
                allowWebRTC: false, // Always off for security
                whitelisted: false
            };
            
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_POLICY',
                domain: this.currentDomain,
                policy: policy
            });
            
            if (response.success) {
                this.currentPolicy = response.policy;
                this.showNotification('Policy applied successfully!', 'success');
                
                // Notify content script
                if (this.currentTab?.id) {
                    chrome.tabs.sendMessage(this.currentTab.id, {
                        type: 'POLICY_UPDATED',
                        policy: this.currentPolicy
                    }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Failed to apply policy:', error);
            this.showNotification('Failed to apply policy', 'error');
        }
    }
    
    async resetPolicy() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'RESET_POLICY',
                domain: this.currentDomain
            });
            
            if (response.success) {
                this.currentPolicy = response.policy;
                this.updateUI();
                this.showNotification('Policy reset to default', 'success');
            }
        } catch (error) {
            console.error('Failed to reset policy:', error);
            this.showNotification('Failed to reset policy', 'error');
        }
    }
    
    async enableLockdown() {
        // Set all toggles to off
        const toggleIds = [
            'allowNetwork', 'allowStorage', 'allowCookies',
            'allowGeolocation', 'allowCamera', 'allowMicrophone',
            'allowDOM', 'allowNotifications', 'allowClipboard'
        ];
        
        toggleIds.forEach(id => {
            const toggle = document.getElementById(id);
            if (toggle) toggle.checked = false;
        });
        
        await this.applyPolicy();
        this.showNotification('🔒 Lockdown mode enabled', 'success');
    }
    
    async whitelistSite() {
        // Set all toggles to on (except high-risk ones)
        const policy = {
            allowNetwork: true,
            allowStorage: true,
            allowCookies: true,
            allowGeolocation: false, // Keep sensitive APIs off
            allowCamera: false,
            allowMicrophone: false,
            allowDOM: true,
            allowNotifications: false,
            allowClipboard: false,
            allowWebRTC: false,
            whitelisted: true
        };
        
        // Update UI
        Object.keys(policy).forEach(key => {
            const toggle = document.getElementById(key);
            if (toggle) toggle.checked = policy[key];
        });
        
        await this.applyPolicy();
        this.showNotification('✅ Site added to whitelist', 'success');
    }
    
    openOptions(section = '') {
        chrome.runtime.openOptionsPage(() => {
            if (chrome.runtime.lastError) {
                console.error('Failed to open options:', chrome.runtime.lastError);
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4caf50' : '#f44336'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
        // Add animation styles
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(0); opacity: 1; }
                    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.popupManager = new PopupManager();
});

// Export for testing
if (typeof module !== 'undefined') {
    module.exports = { PopupManager };
}
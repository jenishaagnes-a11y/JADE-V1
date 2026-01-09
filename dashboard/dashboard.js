class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.isLiveDetection = false;
        this.currentSection = 'overview';
        this.detectionInterval = null;
        
        this.init();
    }
    
    async init() {
        // Setup navigation
        this.setupNavigation();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Initialize charts
        this.initCharts();
        
        // Update time display
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        console.log('Dashboard initialized');
    }
    
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.dashboard-section');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.dataset.section;
                this.switchSection(sectionId);
            });
        });
        
        // Back to popup button
        document.getElementById('backToPopup').addEventListener('click', () => {
            window.close();
        });
    }
    
    switchSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });
        
        // Update sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });
        
        // Update breadcrumb
        document.getElementById('currentSection').textContent = 
            sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        
        // Update title
        const titles = {
            overview: 'Security Overview',
            analytics: 'Advanced Analytics',
            threats: 'Threat Intelligence',
            policies: 'Policy Management',
            reports: 'Security Reports',
            settings: 'Dashboard Settings'
        };
        document.getElementById('dashboardTitle').textContent = titles[sectionId] || 'Dashboard';
        
        this.currentSection = sectionId;
        
        // Load section-specific data
        switch(sectionId) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
            case 'threats':
                this.loadThreatsData();
                break;
            case 'policies':
                this.loadPoliciesData();
                break;
            case 'reports':
                this.loadReportsData();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshDashboard').addEventListener('click', () => {
            this.refreshDashboard();
        });
        
        // Export button
        document.getElementById('exportDashboard').addEventListener('click', () => {
            this.exportDashboard();
        });
        
        // Clear activity button
        document.getElementById('clearActivity').addEventListener('click', () => {
            this.clearActivity();
        });
        
        // Risk filter
        document.getElementById('riskFilter').addEventListener('change', () => {
            this.updateRiskChart();
        });
        
        // Analytics range
        document.getElementById('analyticsRange').addEventListener('change', () => {
            this.loadAnalyticsData();
        });
        
        // Chart tabs
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const chartType = tab.dataset.chart;
                this.switchTrendChart(chartType);
            });
        });
        
        // Detection toggle
        document.getElementById('toggleDetection').addEventListener('click', () => {
            this.toggleLiveDetection();
        });
        
        // Policy actions
        document.getElementById('createPolicy').addEventListener('click', () => {
            this.createPolicy();
        });
        document.getElementById('importPolicies').addEventListener('click', () => {
            this.importPolicies();
        });
        document.getElementById('exportPolicies').addEventListener('click', () => {
            this.exportPolicies();
        });
        
        // Report controls
        document.getElementById('generateReport').addEventListener('click', () => {
            this.generateReport();
        });
        document.getElementById('scheduleReport').addEventListener('click', () => {
            this.scheduleReport();
        });
        
        // Report type selection
        document.querySelectorAll('.report-type-item').forEach(item => {
            item.addEventListener('click', () => {
                const reportType = item.dataset.report;
                this.selectReportType(reportType);
            });
        });
        
        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });
        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });
        document.getElementById('clearAllData').addEventListener('click', () => {
            this.clearAllData();
        });
        document.getElementById('exportAllData').addEventListener('click', () => {
            this.exportAllData();
        });
        
        // Risk threshold slider
        const riskSlider = document.getElementById('riskThreshold');
        const riskValue = document.getElementById('riskThresholdValue');
        riskSlider.addEventListener('input', () => {
            riskValue.textContent = `${riskSlider.value}%`;
        });
        
        // Auto backup toggle
        document.getElementById('autoBackup').addEventListener('change', (e) => {
            document.getElementById('backupFrequency').style.display = 
                e.target.checked ? 'block' : 'none';
        });
    }
    
    async loadDashboardData() {
        try {
            // Load overview data
            await this.loadOverviewData();
            
            // Load analytics data
            await this.loadAnalyticsData();
            
            // Load threats data
            await this.loadThreatsData();
            
            // Load policies data
            await this.loadPoliciesData();
            
            // Load reports data
            await this.loadReportsData();
            
            // Update last updated time
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }
    
    async loadOverviewData() {
        try {
            // Get logs
            const logsResponse = await chrome.runtime.sendMessage({
                type: 'GET_LOGS',
                limit: 1000
            });
            
            if (!logsResponse.success) return;
            
            const logs = logsResponse.logs;
            const today = new Date().setHours(0, 0, 0, 0);
            
            // Calculate stats
            const totalBlocks = logs.filter(log => log.action === 'blocked').length;
            const todayBlocks = logs.filter(log => 
                log.action === 'blocked' && new Date(log.timestamp) >= today
            ).length;
            
            // Get domains
            const domainsResponse = await chrome.runtime.sendMessage({
                type: 'GET_ALL_DOMAINS'
            });
            
            const protectedSites = domainsResponse.success ? domainsResponse.domains.length : 0;
            
            // Calculate average risk
            let avgRisk = 0;
            if (domainsResponse.success && domainsResponse.domains.length > 0) {
                const totalRisk = domainsResponse.domains.reduce((sum, domain) => 
                    sum + (domain.riskScore || 0), 0);
                avgRisk = Math.round(totalRisk / domainsResponse.domains.length);
            }
            
            // Calculate privacy score (inverse of risk)
            const privacyScore = Math.max(0, 100 - avgRisk);
            
            // Update stats
            document.getElementById('totalBlocks').textContent = totalBlocks.toLocaleString();
            document.getElementById('protectedSites').textContent = protectedSites;
            document.getElementById('avgRisk').textContent = `${avgRisk}%`;
            document.getElementById('privacyScore').textContent = `${privacyScore}%`;
            document.getElementById('privacyProgress').style.width = `${privacyScore}%`;
            
            // Update changes
            const blocksChange = todayBlocks > 0 ? `+${todayBlocks}` : '+0';
            document.getElementById('blocksChange').textContent = `${blocksChange} today`;
            
            const sitesChange = protectedSites > 0 ? `+${protectedSites}` : '+0';
            document.getElementById('sitesChange').textContent = sitesChange;
            
            const riskChange = avgRisk > 50 ? `+${avgRisk - 50}%` : `${avgRisk - 50}%`;
            document.getElementById('riskChange').textContent = riskChange;
            document.getElementById('riskChange').className = 
                avgRisk > 50 ? 'change-negative' : 'change-positive';
            
            // Update activity list
            this.updateActivityList(logs.slice(0, 10));
            
            // Update top sites
            this.updateTopSites(logs);
            
            // Update charts
            this.updateRequestsChart(logs);
            this.updateRiskChart();
            
        } catch (error) {
            console.error('Failed to load overview data:', error);
        }
    }
    
    updateActivityList(activities) {
        const container = document.getElementById('activityList');
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="activity-empty">No recent activity</div>';
            return;
        }
        
        container.innerHTML = activities.map(activity => {
            const icon = activity.action === 'blocked' ? 'ban' : 
                        activity.action === 'allowed' ? 'check' : 'exclamation-triangle';
            
            const iconClass = activity.action === 'blocked' ? 'blocked' :
                             activity.action === 'allowed' ? 'allowed' : 'warning';
            
            const time = this.formatTime(activity.timestamp);
            const message = activity.userMessage || activity.reason || 'Activity logged';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon ${iconClass}">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.api} ${activity.action}</div>
                        <div class="activity-desc">${message}</div>
                        <div class="activity-time">${time} • ${activity.domain}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateTopSites(logs) {
        // Group by domain
        const domainBlocks = {};
        logs.forEach(log => {
            if (log.action === 'blocked' && log.domain) {
                if (!domainBlocks[log.domain]) {
                    domainBlocks[log.domain] = 0;
                }
                domainBlocks[log.domain]++;
            }
        });
        
        // Convert to array and sort
        const topSites = Object.entries(domainBlocks)
            .map(([domain, count]) => ({ domain, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        const container = document.getElementById('topSitesList');
        
        if (topSites.length === 0) {
            container.innerHTML = '<div class="top-site-empty">No blocked sites yet</div>';
            document.getElementById('topSitesCount').textContent = '0 sites';
            return;
        }
        
        container.innerHTML = topSites.map(site => {
            // Get risk score for domain
            const riskScore = Math.min(100, site.count * 10);
            const riskClass = riskScore <= 30 ? 'low' : 
                             riskScore <= 70 ? 'medium' : 'high';
            
            return `
                <div class="top-site-item">
                    <div class="site-info">
                        <div class="site-domain">${site.domain}</div>
                        <div class="site-count">${site.count} blocks</div>
                    </div>
                    <div class="site-risk ${riskClass}">${riskScore}%</div>
                </div>
            `;
        }).join('');
        
        document.getElementById('topSitesCount').textContent = `${topSites.length} sites`;
    }
    
    initCharts() {
        // Requests Chart (Bar Chart)
        const requestsCtx = document.getElementById('requestsChart').getContext('2d');
        this.charts.requests = new Chart(requestsCtx, {
            type: 'bar',
            data: {
                labels: ['Network', 'Storage', 'Cookies', 'Sensors', 'Notifications', 'Clipboard'],
                datasets: [{
                    label: 'Blocked',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.7)',
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(255, 152, 0, 0.7)',
                        'rgba(244, 67, 54, 0.7)',
                        'rgba(156, 39, 176, 0.7)',
                        'rgba(33, 150, 243, 0.7)'
                    ],
                    borderColor: [
                        'rgb(102, 126, 234)',
                        'rgb(76, 175, 80)',
                        'rgb(255, 152, 0)',
                        'rgb(244, 67, 54)',
                        'rgb(156, 39, 176)',
                        'rgb(33, 150, 243)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        // Risk Chart (Doughnut)
        const riskCtx = document.getElementById('riskChart').getContext('2d');
        this.charts.risk = new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [1, 1, 1],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(255, 152, 0, 0.7)',
                        'rgba(244, 67, 54, 0.7)'
                    ],
                    borderColor: [
                        'rgb(76, 175, 80)',
                        'rgb(255, 152, 0)',
                        'rgb(244, 67, 54)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '70%'
            }
        });
        
        // Trend Chart (Line)
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        this.charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Blocks',
                    data: [],
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    updateRequestsChart(logs) {
        if (!this.charts.requests) return;
        
        const categories = {
            'fetch': 'Network',
            'XMLHttpRequest': 'Network',
            'localStorage': 'Storage',
            'sessionStorage': 'Storage',
            'cookies': 'Cookies',
            'geolocation': 'Sensors',
            'mediaDevices': 'Sensors',
            'Notification': 'Notifications',
            'clipboard': 'Clipboard'
        };
        
        const counts = {
            'Network': 0,
            'Storage': 0,
            'Cookies': 0,
            'Sensors': 0,
            'Notifications': 0,
            'Clipboard': 0
        };
        
        logs.forEach(log => {
            if (log.action === 'blocked' && categories[log.api]) {
                counts[categories[log.api]]++;
            }
        });
        
        this.charts.requests.data.datasets[0].data = [
            counts.Network,
            counts.Storage,
            counts.Cookies,
            counts.Sensors,
            counts.Notifications,
            counts.Clipboard
        ];
        
        this.charts.requests.update();
    }
    
    async updateRiskChart() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_ALL_DOMAINS'
            });
            
            if (!response.success) return;
            
            const filter = document.getElementById('riskFilter').value;
            let domains = response.domains;
            
            if (filter !== 'all') {
                domains = domains.filter(domain => {
                    const risk = domain.riskScore || 0;
                    if (filter === 'high') return risk >= 70;
                    if (filter === 'medium') return risk >= 30 && risk < 70;
                    if (filter === 'low') return risk < 30;
                    return true;
                });
            }
            
            const lowRisk = domains.filter(d => (d.riskScore || 0) < 30).length;
            const mediumRisk = domains.filter(d => {
                const risk = d.riskScore || 0;
                return risk >= 30 && risk < 70;
            }).length;
            const highRisk = domains.filter(d => (d.riskScore || 0) >= 70).length;
            
            if (this.charts.risk) {
                this.charts.risk.data.datasets[0].data = [lowRisk, mediumRisk, highRisk];
                this.charts.risk.update();
            }
            
        } catch (error) {
            console.error('Failed to update risk chart:', error);
        }
    }
    
    async loadAnalyticsData() {
        try {
            const days = parseInt(document.getElementById('analyticsRange').value) || 30;
            
            // Get logs for the period
            const response = await chrome.runtime.sendMessage({
                type: 'GET_LOGS',
                limit: 10000
            });
            
            if (!response.success) return;
            
            // Generate dates for the period
            const dates = [];
            const now = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
            
            // Calculate daily blocks
            const dailyBlocks = new Array(days).fill(0);
            response.logs.forEach(log => {
                if (log.action === 'blocked') {
                    const logDate = new Date(log.timestamp);
                    const diffDays = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
                    if (diffDays >= 0 && diffDays < days) {
                        dailyBlocks[days - 1 - diffDays]++;
                    }
                }
            });
            
            // Update trend chart
            if (this.charts.trend) {
                this.charts.trend.data.labels = dates;
                this.charts.trend.data.datasets[0].data = dailyBlocks;
                this.charts.trend.update();
            }
            
            // Update metrics
            const peakBlocks = Math.max(...dailyBlocks);
            const avgBlocks = dailyBlocks.reduce((a, b) => a + b, 0) / days;
            const trend = avgBlocks > 0 ? ((peakBlocks - avgBlocks) / avgBlocks * 100).toFixed(1) : 0;
            
            document.getElementById('peakBlocks').textContent = peakBlocks;
            document.getElementById('riskTrend').textContent = `${trend}%`;
            document.getElementById('riskTrend').className = `metric-value ${trend >= 0 ? 'trend-positive' : 'trend-negative'}`;
            
            // Calculate most blocked API
            const apiCounts = {};
            response.logs.forEach(log => {
                if (log.action === 'blocked') {
                    apiCounts[log.api] = (apiCounts[log.api] || 0) + 1;
                }
            });
            
            let topApi = 'None';
            let maxCount = 0;
            Object.entries(apiCounts).forEach(([api, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    topApi = api;
                }
            });
            
            document.getElementById('topApi').textContent = topApi;
            document.getElementById('newThreats').textContent = 
                response.logs.filter(log => 
                    log.action === 'detected' && 
                    new Date(log.timestamp) >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
                ).length;
            
            // Update insights
            this.updateInsights(response.logs, days);
            
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        }
    }
    
    updateInsights(logs, days) {
        const insightElement = document.getElementById('insight1');
        
        // Calculate insights
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentBlocks = logs.filter(log => 
            log.action === 'blocked' && new Date(log.timestamp) >= weekAgo
        ).length;
        
        const previousWeekBlocks = logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return log.action === 'blocked' && 
                   logDate >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) &&
                   logDate < weekAgo;
        }).length;
        
        const changePercent = previousWeekBlocks > 0 ? 
            ((recentBlocks - previousWeekBlocks) / previousWeekBlocks * 100).toFixed(1) : 100;
        
        let insightText = '';
        if (changePercent > 20) {
            insightText = `⚠️ Blocking activity increased by ${changePercent}% this week`;
        } else if (changePercent < -20) {
            insightText = `✅ Blocking activity decreased by ${Math.abs(changePercent)}% this week`;
        } else {
            insightText = `📊 Blocking activity is stable this week`;
        }
        
        insightElement.querySelector('.insight-text').textContent = insightText;
    }
    
    switchTrendChart(chartType) {
        // Update tabs
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.chart === chartType);
        });
        
        // TODO: Implement different chart types
        console.log('Switching to chart:', chartType);
    }
    
    async loadThreatsData() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_LOGS',
                limit: 1000
            });
            
            if (!response.success) return;
            
            const today = new Date().setHours(0, 0, 0, 0);
            const logs = response.logs;
            
            // Calculate threat stats
            const activeThreats = logs.filter(log => 
                log.action === 'detected' && new Date(log.timestamp) >= today
            ).length;
            
            const blockedThreats = logs.filter(log => 
                log.action === 'blocked' && new Date(log.timestamp) >= today
            ).length;
            
            const detectedThreats = logs.filter(log => 
                log.action === 'detected'
            ).length;
            
            document.getElementById('activeThreats').textContent = activeThreats;
            document.getElementById('blockedThreats').textContent = blockedThreats;
            document.getElementById('detectedThreats').textContent = detectedThreats;
            
            // Calculate threat types
            const threatTypes = {
                tracking: 0,
                dataCollection: 0,
                surveillance: 0,
                malicious: 0
            };
            
            logs.forEach(log => {
                if (log.action === 'blocked' || log.action === 'detected') {
                    const reason = log.reason || '';
                    if (reason.includes('tracking') || reason.includes('pixel')) {
                        threatTypes.tracking++;
                    } else if (reason.includes('storage') || reason.includes('cookie') || reason.includes('data')) {
                        threatTypes.dataCollection++;
                    } else if (reason.includes('camera') || reason.includes('mic') || reason.includes('location')) {
                        threatTypes.surveillance++;
                    } else {
                        threatTypes.malicious++;
                    }
                }
            });
            
            // Update threat type bars
            const total = Object.values(threatTypes).reduce((a, b) => a + b, 0);
            
            if (total > 0) {
                document.getElementById('trackingCount').textContent = threatTypes.tracking;
                document.getElementById('dataCollectionCount').textContent = threatTypes.dataCollection;
                document.getElementById('surveillanceCount').textContent = threatTypes.surveillance;
                document.getElementById('maliciousCount').textContent = threatTypes.malicious;
                
                document.querySelector('.threat-type-fill.tracking').style.width = 
                    `${(threatTypes.tracking / total * 100)}%`;
                document.querySelector('.threat-type-fill.data-collection').style.width = 
                    `${(threatTypes.dataCollection / total * 100)}%`;
                document.querySelector('.threat-type-fill.surveillance').style.width = 
                    `${(threatTypes.surveillance / total * 100)}%`;
                document.querySelector('.threat-type-fill.malicious').style.width = 
                    `${(threatTypes.malicious / total * 100)}%`;
            }
            
            // Update detection log
            this.updateDetectionLog(logs.filter(log => 
                log.action === 'detected' || log.action === 'blocked'
            ).slice(0, 10));
            
        } catch (error) {
            console.error('Failed to load threats data:', error);
        }
    }
    
    updateDetectionLog(logs) {
        const container = document.getElementById('detectionLog');
        
        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="log-empty">No threats detected recently</div>';
            return;
        }
        
        container.innerHTML = logs.map(log => {
            const riskClass = (log.riskScore || 0) >= 70 ? 'high' : 
                             (log.riskScore || 0) >= 30 ? 'medium' : 'low';
            
            const time = this.formatTime(log.timestamp);
            const message = log.userMessage || log.reason || 'Threat detected';
            
            return `
                <div class="log-item ${riskClass}">
                    <div class="log-header">
                        <span class="log-domain">${log.domain}</span>
                        <span class="log-action">${log.action.toUpperCase()}</span>
                    </div>
                    <div class="log-message">${message}</div>
                    <div class="log-time">${time} • ${log.api}</div>
                </div>
            `;
        }).join('');
    }
    
    toggleLiveDetection() {
        const toggleBtn = document.getElementById('toggleDetection');
        this.isLiveDetection = !this.isLiveDetection;
        
        if (this.isLiveDetection) {
            toggleBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            toggleBtn.classList.add('active');
            this.startLiveDetection();
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-play"></i> Live';
            toggleBtn.classList.remove('active');
            this.stopLiveDetection();
        }
    }
    
    startLiveDetection() {
        // Simulate live detection updates
        this.detectionInterval = setInterval(() => {
            // In a real implementation, this would check for new threats
            console.log('Checking for new threats...');
        }, 5000);
    }
    
    stopLiveDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }
    
    async loadPoliciesData() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_ALL_DOMAINS'
            });
            
            if (!response.success) return;
            
            const domains = response.domains;
            
            // Update counts
            document.getElementById('policyCount').textContent = `${domains.length} policies`;
            
            const whitelisted = domains.filter(d => d.policy.whitelisted).length;
            const restricted = domains.filter(d => {
                const enabledCount = Object.entries(d.policy).filter(([key, value]) => 
                    key.startsWith('allow') && value === true
                ).length;
                return enabledCount <= 2; // Very restrictive
            }).length;
            
            document.getElementById('whitelistCount').textContent = `${whitelisted} whitelisted`;
            document.getElementById('restrictedCount').textContent = `${restricted} restricted`;
            
            // Update table
            this.updatePoliciesTable(domains);
            
        } catch (error) {
            console.error('Failed to load policies data:', error);
        }
    }
    
    updatePoliciesTable(domains) {
        const tbody = document.getElementById('policiesTableBody');
        
        if (!domains || domains.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty">No policies defined yet</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = domains.map(domain => {
            const riskScore = domain.riskScore || 0;
            const riskClass = riskScore <= 30 ? 'low' : 
                             riskScore <= 70 ? 'medium' : 'high';
            
            const enabledCount = Object.entries(domain.policy).filter(([key, value]) => 
                key.startsWith('allow') && value === true
            ).length;
            
            const totalCount = Object.keys(domain.policy).filter(key => 
                key.startsWith('allow')
            ).length;
            
            const status = domain.policy.whitelisted ? 'whitelisted' : 
                          enabledCount <= 2 ? 'restricted' : 'active';
            
            const lastUpdated = new Date(domain.policy.lastUpdated);
            const timeAgo = this.formatTime(lastUpdated.getTime());
            
            return `
                <tr>
                    <td>
                        <div class="domain-name">${domain.domain}</div>
                        <div class="domain-permissions">${enabledCount}/${totalCount} enabled</div>
                    </td>
                    <td>
                        <span class="risk-badge ${riskClass}">${riskScore}%</span>
                    </td>
                    <td>
                        <div class="permissions-summary">
                            ${enabledCount > 0 ? '✅' : '❌'} ${enabledCount} permissions
                        </div>
                    </td>
                    <td>
                        <div class="time-ago">${timeAgo}</div>
                        <div class="full-date">${lastUpdated.toLocaleDateString()}</div>
                    </td>
                    <td>
                        <span class="status-badge ${status}">${status}</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit" onclick="window.dashboardManager.editPolicy('${domain.domain}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn delete" onclick="window.dashboardManager.deletePolicy('${domain.domain}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    async loadReportsData() {
        try {
            // Get today's stats
            const logsResponse = await chrome.runtime.sendMessage({
                type: 'GET_LOGS',
                limit: 10000
            });
            
            if (!logsResponse.success) return;
            
            const today = new Date().setHours(0, 0, 0, 0);
            const todayBlocks = logsResponse.logs.filter(log => 
                log.action === 'blocked' && new Date(log.timestamp) >= today
            ).length;
            
            // Get domains for average risk
            const domainsResponse = await chrome.runtime.sendMessage({
                type: 'GET_ALL_DOMAINS'
            });
            
            let avgRisk = 0;
            if (domainsResponse.success && domainsResponse.domains.length > 0) {
                const totalRisk = domainsResponse.domains.reduce((sum, domain) => 
                    sum + (domain.riskScore || 0), 0);
                avgRisk = Math.round(totalRisk / domainsResponse.domains.length);
            }
            
            // Get threats
            const threats = logsResponse.logs.filter(log => 
                log.action === 'detected' && new Date(log.timestamp) >= today
            ).length;
            
            // Update preview
            document.getElementById('previewBlocks').textContent = todayBlocks;
            document.getElementById('previewRisk').textContent = `${avgRisk}%`;
            document.getElementById('previewThreats').textContent = threats;
            
            // Update insights
            this.updateReportInsights(logsResponse.logs);
            
        } catch (error) {
            console.error('Failed to load reports data:', error);
        }
    }
    
    updateReportInsights(logs) {
        const insightsList = document.getElementById('reportInsights');
        
        const today = new Date().setHours(0, 0, 0, 0);
        const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
        
        // Calculate insights
        const todayBlocks = logs.filter(log => 
            log.action === 'blocked' && new Date(log.timestamp) >= today
        ).length;
        
        const weekBlocks = logs.filter(log => 
            log.action === 'blocked' && new Date(log.timestamp) >= weekAgo
        ).length;
        
        const avgDaily = Math.round(weekBlocks / 7);
        
        const apiCounts = {};
        logs.forEach(log => {
            if (log.action === 'blocked' && new Date(log.timestamp) >= weekAgo) {
                apiCounts[log.api] = (apiCounts[log.api] || 0) + 1;
            }
        });
        
        let topApi = 'None';
        let maxCount = 0;
        Object.entries(apiCounts).forEach(([api, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topApi = api;
            }
        });
        
        insightsList.innerHTML = `
            <li>Blocked ${todayBlocks} requests today</li>
            <li>Average ${avgDaily} blocks per day this week</li>
            <li>Most blocked API: ${topApi} (${maxCount} times)</li>
            <li>${weekBlocks} total blocks in the last 7 days</li>
        `;
    }
    
    selectReportType(reportType) {
        // Update active report type
        document.querySelectorAll('.report-type-item').forEach(item => {
            item.classList.toggle('active', item.dataset.report === reportType);
        });
        
        // Update preview title
        const titles = {
            daily: 'Daily Summary Report',
            weekly: 'Weekly Analysis Report',
            monthly: 'Monthly Security Report',
            custom: 'Custom Security Report'
        };
        
        document.getElementById('reportPreviewTitle').textContent = 
            titles[reportType] || 'Security Report';
        
        // Update date
        const now = new Date();
        let dateText = '';
        
        switch(reportType) {
            case 'daily':
                dateText = now.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                break;
            case 'weekly':
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                dateText = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
                break;
            case 'monthly':
                dateText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                break;
            default:
                dateText = 'Custom Range';
        }
        
        document.getElementById('reportDate').textContent = dateText;
    }
    
    async loadSettings() {
        try {
            const settings = await chrome.storage.local.get([
                'refreshInterval',
                'theme',
                'notifyThreats',
                'notifyHighRisk',
                'notifyWeeklyReport',
                'riskThreshold',
                'alertDashboard',
                'alertSound',
                'alertBadge',
                'dataRetention',
                'autoBackup',
                'backupInterval'
            ]);
            
            // Set refresh interval
            document.getElementById('refreshInterval').value = 
                settings.refreshInterval || 60;
            
            // Set theme
            const theme = settings.theme || 'light';
            document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
            
            // Set notifications
            document.getElementById('notifyThreats').checked = 
                settings.notifyThreats !== false;
            document.getElementById('notifyHighRisk').checked = 
                settings.notifyHighRisk !== false;
            document.getElementById('notifyWeeklyReport').checked = 
                settings.notifyWeeklyReport || false;
            
            // Set alerts
            document.getElementById('riskThreshold').value = 
                settings.riskThreshold || 70;
            document.getElementById('riskThresholdValue').textContent = 
                `${settings.riskThreshold || 70}%`;
            
            document.getElementById('alertDashboard').checked = 
                settings.alertDashboard !== false;
            document.getElementById('alertSound').checked = 
                settings.alertSound || false;
            document.getElementById('alertBadge').checked = 
                settings.alertBadge || false;
            
            // Set data management
            document.getElementById('dataRetention').value = 
                settings.dataRetention || 30;
            document.getElementById('autoBackup').checked = 
                settings.autoBackup !== false;
            document.getElementById('backupInterval').value = 
                settings.backupInterval || 'weekly';
            
            document.getElementById('backupFrequency').style.display = 
                settings.autoBackup !== false ? 'block' : 'none';
            
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    async saveSettings() {
        try {
            const settings = {
                refreshInterval: parseInt(document.getElementById('refreshInterval').value),
                theme: document.querySelector('input[name="theme"]:checked').value,
                notifyThreats: document.getElementById('notifyThreats').checked,
                notifyHighRisk: document.getElementById('notifyHighRisk').checked,
                notifyWeeklyReport: document.getElementById('notifyWeeklyReport').checked,
                riskThreshold: parseInt(document.getElementById('riskThreshold').value),
                alertDashboard: document.getElementById('alertDashboard').checked,
                alertSound: document.getElementById('alertSound').checked,
                alertBadge: document.getElementById('alertBadge').checked,
                dataRetention: parseInt(document.getElementById('dataRetention').value),
                autoBackup: document.getElementById('autoBackup').checked,
                backupInterval: document.getElementById('backupInterval').value
            };
            
            await chrome.storage.local.set(settings);
            
            // Update auto-refresh
            this.startAutoRefresh();
            
            // Apply theme
            this.applyTheme(settings.theme);
            
            this.showNotification('Settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }
    
    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-mode');
        } else {
            // Auto theme based on system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    }
    
    resetSettings() {
        if (confirm('Reset all dashboard settings to default?')) {
            // Reset form to defaults
            document.getElementById('refreshInterval').value = 60;
            document.querySelector('input[name="theme"][value="light"]').checked = true;
            document.getElementById('notifyThreats').checked = true;
            document.getElementById('notifyHighRisk').checked = true;
            document.getElementById('notifyWeeklyReport').checked = false;
            document.getElementById('riskThreshold').value = 70;
            document.getElementById('riskThresholdValue').textContent = '70%';
            document.getElementById('alertDashboard').checked = true;
            document.getElementById('alertSound').checked = false;
            document.getElementById('alertBadge').checked = false;
            document.getElementById('dataRetention').value = 30;
            document.getElementById('autoBackup').checked = true;
            document.getElementById('backupInterval').value = 'weekly';
            document.getElementById('backupFrequency').style.display = 'block';
            
            this.showNotification('Settings reset to defaults', 'success');
        }
    }
    
    async refreshDashboard() {
        // Show loading state
        const refreshBtn = document.getElementById('refreshDashboard');
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        refreshBtn.disabled = true;
        
        try {
            await this.loadDashboardData();
            this.showNotification('Dashboard refreshed', 'success');
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
            this.showNotification('Failed to refresh dashboard', 'error');
        } finally {
            // Restore button state
            setTimeout(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                refreshBtn.disabled = false;
            }, 1000);
        }
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        const interval = parseInt(document.getElementById('refreshInterval').value) * 1000;
        
        if (interval > 0) {
            this.refreshInterval = setInterval(() => {
                this.refreshDashboard();
            }, interval);
        }
    }
    
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }
    
    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = 
            `Last updated: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `dashboard-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-left: 4px solid ${type === 'success' ? '#4CAF50' : '#F44336'};
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => style.remove(), 3300);
    }
    
    // Placeholder methods for future implementation
    exportDashboard() {
        this.showNotification('Export feature coming soon!', 'info');
    }
    
    clearActivity() {
        if (confirm('Clear all activity logs?')) {
            this.showNotification('Activity logs cleared', 'success');
        }
    }
    
    createPolicy() {
        this.showNotification('Policy creation coming soon!', 'info');
    }
    
    importPolicies() {
        this.showNotification('Import feature coming soon!', 'info');
    }
    
    exportPolicies() {
        this.showNotification('Export feature coming soon!', 'info');
    }
    
    generateReport() {
        this.showNotification('Report generation coming soon!', 'info');
    }
    
    scheduleReport() {
        this.showNotification('Scheduling feature coming soon!', 'info');
    }
    
    clearAllData() {
        if (confirm('WARNING: This will delete ALL data including policies, logs, and settings. Are you sure?')) {
            this.showNotification('Data cleared', 'success');
        }
    }
    
    exportAllData() {
        this.showNotification('Export all data feature coming soon!', 'info');
    }
    
    editPolicy(domain) {
        console.log('Edit policy for:', domain);
        this.showNotification(`Editing policy for ${domain}`, 'info');
    }
    
    deletePolicy(domain) {
        if (confirm(`Delete policy for ${domain}?`)) {
            this.showNotification(`Policy for ${domain} deleted`, 'success');
        }
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
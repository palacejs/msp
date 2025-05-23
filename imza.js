(function() {
    let savedProfiles = new Set();
    let bearerToken = null;
    let autoSendIntervals = new Map();
    let autoSendEnabled = false;
    let autoSaveProfilesEnabled = true;
    let panelCollapsed = false;

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '-60px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.background = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#fff';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '8px';
        notification.style.fontSize = '14px';
        notification.style.fontFamily = 'Arial, sans-serif';
        notification.style.zIndex = '10000';
        notification.style.opacity = '0';
        notification.style.transition = 'top 0.5s ease, opacity 0.5s ease';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.top = '30px';
            notification.style.opacity = '1';
        }, 50);

        setTimeout(() => {
            notification.style.top = '-60px';
            notification.style.opacity = '0';
        }, 3000);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '20px';
    panel.style.right = '20px';
    panel.style.background = 'rgba(0,0,0,0.7)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.borderRadius = '8px';
    panel.style.zIndex = 9999;
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.width = '150px';
    panel.style.cursor = 'move';
    panel.style.transition = 'all 0.3s ease';
    panel.innerHTML = `
        <div id="profileCountContainer" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
            <div id="profileCount" style="font-size:13px;">Save Profile ID: 0</div>
            <button id="togglePanelVisibilityBtn" style="width:20px; height:20px; border:none; border-radius:50%; background:#ffffff; color:#000000; font-weight:bold; cursor:pointer; font-size:14px; margin-left:5px;">+</button>
        </div>
        <select id="greetingTypeSelector" style="margin-bottom:10px;width:100%;padding:5px;border-radius:5px;">
            <option value="Autograph">Autograph</option>
            <option value="StarGreeting">StarGreeting</option>
            <option value="LoveGreeting">LoveGreeting</option>
            <option value="RainbowGreeting">RainbowGreeting</option>
            <option value="PartyGreeting">PartyGreeting</option>
            <option value="SuperStarGreeting">SuperStarGreeting</option>
        </select>
        <button id="sendGreetingsBtn" style="margin-bottom:10px;padding:5px 10px;border:none;background:#4CAF50;color:white;border-radius:5px;width:100%;cursor:pointer;">Run</button>
        <button id="resetProfilesBtn" style="margin-bottom:10px;padding:5px 10px;border:none;background:#f44336;color:white;border-radius:5px;width:100%;cursor:pointer;">Reset Profile ID</button>
        <button id="stopAutoSendBtn" style="margin-bottom:10px;padding:5px 10px;border:none;background:#FF9800;color:white;border-radius:5px;width:100%;cursor:pointer;">Stop</button>
        <button id="toggleAutoSendBtn" style="margin-bottom:10px;padding:5px 10px;border:none;background:#2196F3;color:white;border-radius:5px;width:100%;cursor:pointer;">Auto send: Off</button>
        <button id="toggleAutoSaveProfilesBtn" style="margin-bottom:10px;padding:5px 10px;border:none;background:#9C27B0;color:white;border-radius:5px;width:100%;cursor:pointer;">Profile ID: On</button>
        <button id="closePanelBtn" style="padding:5px 10px;border:none;background:#607d8b;color:white;border-radius:5px;width:100%;cursor:pointer;">Close</button>
    `;
    document.body.appendChild(panel);

    let offsetX = 0;
    let offsetY = 0;

    panel.addEventListener('mousedown', (e) => {
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        window.addEventListener('mousemove', movePanel);
        window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', movePanel);
        });
    });

    function movePanel(e) {
        panel.style.left = e.clientX - offsetX + 'px';
        panel.style.top = e.clientY - offsetY + 'px';
    }

    function updateProfileCount() {
        document.getElementById('profileCount').textContent = `Save Profile ID: ${savedProfiles.size}`;
    }

    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
        if (typeof url === 'string' && url.includes('/profileattributes/v1/profiles/')) {
            const regex = /\/profileattributes\/v1\/profiles\/([^/]+)\//;
            const match = url.match(regex);
            if (match && match[1]) {
                const realProfileId = match[1];
                if (autoSaveProfilesEnabled && !savedProfiles.has(realProfileId)) {
                    savedProfiles.add(realProfileId);
                    console.log("[Profile saved]:", realProfileId);
                    updateProfileCount();
                }
            }
        }

        if (options && options.headers && options.headers['Authorization']) {
            bearerToken = options.headers['Authorization'];
        } else if (options && options.headers && options.headers.get) {
            const auth = options.headers.get('Authorization');
            if (auth) {
                bearerToken = auth;
            }
        }

        return originalFetch.apply(this, arguments);
    };

    document.getElementById('toggleAutoSaveProfilesBtn').addEventListener('click', () => {
        autoSaveProfilesEnabled = !autoSaveProfilesEnabled;
        const status = autoSaveProfilesEnabled ? "On" : "Off";
        document.getElementById('toggleAutoSaveProfilesBtn').textContent = `Profile ID: ${status}`;
        showNotification(`Profile ID ${status}`);
    });

    document.getElementById('sendGreetingsBtn').addEventListener('click', async () => {
        if (!bearerToken) {
            alert('Profile ID not found. First click on a profile and save it');
            return;
        }
        if (savedProfiles.size === 0) {
            alert('No profiles saved yet.');
            return;
        }

        const profiles = Array.from(savedProfiles);
        let success = true;
        const greetingType = document.getElementById('greetingTypeSelector').value;

        const promises = profiles.map(profileId => {
            const payload = {
                id: "SendGreetings-159BDD7706D824BB8F14874A7FAE3368",
                variables: {
                    greetingType: greetingType,
                    receiverProfileId: profileId,
                    ignoreDailyCap: false
                }
            };

            return fetch("https://eu.mspapis.com/federationgateway/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": bearerToken
                },
                body: JSON.stringify(payload)
            }).then(response => response.json())
            .then(data => {
                console.log("Successful ✅", data);
            })
            .catch(error => {
                console.error("Error ❌", error);
                success = false;
            });
        });

        await Promise.all(promises);

        if (success) {
            showNotification("Success");
        } else {
            showNotification("Failed");
        }

        if (autoSendEnabled) {
            profiles.forEach(profileId => {
                const intervalId = setInterval(() => {
                    const payload = {
                        id: "SendGreetings-159BDD7706D824BB8F14874A7FAE3368",
                        variables: {
                            greetingType: greetingType,
                            receiverProfileId: profileId,
                            ignoreDailyCap: false
                        }
                    };

                    fetch("https://eu.mspapis.com/federationgateway/graphql", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": bearerToken
                        },
                        body: JSON.stringify(payload)
                    }).catch(error => {
                        console.error("❌ 2 minutes later send error:", error);
                    });
                }, 2 * 60 * 1000);
                autoSendIntervals.set(profileId, intervalId);
            });
        }
    });

    document.getElementById('resetProfilesBtn').addEventListener('click', () => {
        savedProfiles.clear();
        updateProfileCount();
        showNotification("Success");
        console.log("🧹 All saved profiles cleared.");
    });

    document.getElementById('stopAutoSendBtn').addEventListener('click', () => {
        if (autoSendIntervals.size === 0) {
            alert('Automatic shipping has not been started yet.');
            return;
        }

        autoSendIntervals.forEach((intervalId, profileId) => {
            clearInterval(intervalId);
            console.log(`✅ Auto sending stopped: Profile ID - ${profileId}`);
        });

        autoSendIntervals.clear();
        showNotification("Stopped");
    });

    document.getElementById('toggleAutoSendBtn').addEventListener('click', () => {
        autoSendEnabled = !autoSendEnabled;
        const status = autoSendEnabled ? "On" : "Off";
        document.getElementById('toggleAutoSendBtn').textContent = `Auto send: ${status}`;
        showNotification(`Auto send ${status}`);
    });

    document.getElementById('closePanelBtn').addEventListener('click', () => {
        document.body.removeChild(panel);
        console.log("❌ Panel closed.");
    });

    // Panel gizle/aç butonu
    document.getElementById('togglePanelVisibilityBtn').addEventListener('click', () => {
        panelCollapsed = !panelCollapsed;
        const allButtons = panel.querySelectorAll('button:not(#togglePanelVisibilityBtn)');
        const greetingSelector = panel.querySelector('#greetingTypeSelector');

        if (panelCollapsed) {
            allButtons.forEach(btn => btn.style.display = 'none');
            if (greetingSelector) greetingSelector.style.display = 'none';
            document.getElementById('togglePanelVisibilityBtn').textContent = '-';
            panel.style.width = '150px';
        } else {
            allButtons.forEach(btn => btn.style.display = 'block');
            if (greetingSelector) greetingSelector.style.display = 'block';
            document.getElementById('togglePanelVisibilityBtn').textContent = '+';
            panel.style.width = '150px';
        }
    });

})();

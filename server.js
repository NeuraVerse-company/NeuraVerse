const express = require("express");
const WebSocket = require("ws");
const path = require("path");

// Configurar o servidor Express
const app = express();

// Servir arquivos estáticos da pasta Public
app.use(express.static(path.join(__dirname, "Public")));

// Rotas para arquivos HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "index.html"));
});

app.get("/neuracast", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "Mistermind.html"));
});

app.get("/neurainformation", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "NeuraInformation.html"));
});

app.get("/quem-somos", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "QuemSomos.html"));
});

app.get("/projetos", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "Projetos.html"));
});

// Rota para fornecer as chaves ao frontend
app.get("/api/keys", (req, res) => {
    const requiredEnvVars = [
        "AZURE_SPEECH_KEY",
        "AZURE_SPEECH_REGION",
        "AZURE_OPENAI_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_DEPLOYMENT",
        "ELEVENLABS_API_KEY",
        "ELEVENLABS_VOICE_ID"
    ];

    // Verificar se todas as variáveis de ambiente estão definidas
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        return res.status(500).json({
            error: `As seguintes variáveis de ambiente estão faltando: ${missingVars.join(", ")}`
        });
    }

    res.json({
        speechKey: process.env.AZURE_SPEECH_KEY,
        speechRegion: process.env.AZURE_SPEECH_REGION, // Removido o fallback para "eastus"
        openaiKey: process.env.AZURE_OPENAI_KEY,
        openaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        openaiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
        elevenlabsKey: process.env.ELEVENLABS_API_KEY,
        elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID
    });
});

// Iniciar o servidor Express
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

// Configurar WebSocket
const wss = new WebSocket.Server({ server });

// WebSocket para comunicação com o frontend
wss.on("connection", (ws) => {
    console.log("Cliente conectado via WebSocket");

    ws.on("message", async (message) => {
        const data = JSON.parse(message);
        console.log("Mensagem recebida do cliente:", data);

        if (data.text) {
            // Enviar o texto para o Azure OpenAI
            try {
                const apiKey = process.env.AZURE_OPENAI_KEY;
                const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
                const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
                const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-05-15`;

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "api-key": apiKey
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: "Você é Bruno Perini, criador do canal 'Você Mais Rico', especialista em finanças e investimentos..." },
                            { role: "user", content: data.text }
                        ],
                        max_tokens: 150,
                        temperature: 0.7
                    })
                });

                if (!response.ok) throw new Error("Erro na resposta da API: " + response.statusText);
                const result = await response.json();
                const aiResponse = result.choices[0].message.content.trim();

                // Enviar a resposta do modelo de volta ao frontend
                ws.send(JSON.stringify({ text: data.text, response: aiResponse }));
            } catch (err) {
                console.error("Erro ao processar com OpenAI:", err);
                ws.send(JSON.stringify({ error: "Erro ao processar a solicitação: " + err.message }));
            }
        } else if (data.error) {
            ws.send(JSON.stringify({ error: data.error }));
        } else if (data.action === "stop") {
            console.log("Ação de parada recebida.");
        }
    });

    ws.on("close", () => {
        console.log("Cliente desconectado");
    });
});
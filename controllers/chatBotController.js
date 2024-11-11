const geminiChatModels = {
    homePage: require("../homePageGeminiChatConfig.js"),
    fingerPrint: require("../fingerPrintGeminiChatConfig.js"),
    loginPage: require("../LoginPageGeminiConfig.js"),
    moreServices: require("../more-servicesGeminiChatConfig.js"),
};

let sharedHistory = [];

async function startChat(req, res, modelKey) {
    let userChat = req.body.userInput;
    let geminiChatModel = geminiChatModels[modelKey];

    try {
        let geminiChat;
        console.log(sharedHistory);
        if (sharedHistory.length > 0) {
            geminiChat = geminiChatModel.startChat({
                history: sharedHistory,
            });
        } else {
            // Provide an initial history or leave it empty
            geminiChat = geminiChatModel.startChat({ history: [] });
        }

        let result = await geminiChat.sendMessageStream(userChat);
        let responseText = '';
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            process.stdout.write(chunkText);
            responseText += chunkText;
        }

        if (responseText !== '') {
            sharedHistory.push({
                role: "user",
                parts: [{ text: userChat }],
            });

            sharedHistory.push({
                role: "model",
                parts: [{ text: responseText }],
            });
        }

        return res.status(200).json({ responseText });
    } catch (error) {
        console.error('Error starting chat:', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Example route handlers
async function startChatForHomePage(req, res) {
    return startChat(req, res, 'homePage');
}

async function startChatForFingerPrint(req, res) {
    return startChat(req, res, 'fingerPrint');
}

async function startChatForLoginPage(req, res) {
    return startChat(req, res, 'loginPage');
}

async function startChatForMoreServices(req, res) {
    return startChat(req, res, 'moreServices');
}

module.exports = {
    startChatForHomePage,
    startChatForFingerPrint,
    startChatForLoginPage,
    startChatForMoreServices,
};

// Import all Gemini config files
const homePageGeminiChatModel = require("../homePageGeminiChatConfig.js");
const fingerPrintGeminiChatModel = require("../fingerPrintGeminiChatConfig.js");
const loginPageGeminiChatModel = require("../LoginPageGeminiConfig.js");
const moreServicesGeminiChatModel = require("../more-servicesGeminiChatConfig.js");
const transferFundGeminiChatModel = require("../transferFundGeminiChatConfig.js");

// Map model keys to their corresponding Gemini models
const geminiChatModels = {
    homePage: homePageGeminiChatModel,
    fingerPrint: fingerPrintGeminiChatModel,
    loginPage: loginPageGeminiChatModel,
    moreServices: moreServicesGeminiChatModel,
    transferFund: transferFundGeminiChatModel,
};

// Global shared history variable
let sharedHistory = [];

// Generic chat function using global shared history
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
            // Provide an initial history based on the modelKey
            let initialHistory = getInitialHistory(modelKey);
            geminiChat = geminiChatModel.startChat({ history: initialHistory });
            sharedHistory = initialHistory; // Initialize the shared history
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

// Function to provide initial history based on the page
function getInitialHistory(modelKey) {
    switch (modelKey) {
        case 'homePage':
            return [
                {
                    role: "user",
                    parts: [{ text: "Hello" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hi there! How can I assist you today?" }],
                },
            ];
        case 'fingerPrint':
            return [
                {
                    role: "user",
                    parts: [{ text: "Hello" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Welcome! I'm here to help you with fingerprint login." }],
                },
            ];
        case 'loginPage':
            return [
                {
                    role: "user",
                    parts: [{ text: "Hello" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hello! How would you like to log in today?" }],
                },
            ];
        case 'moreServices':
            return [
                {
                    role: "user",
                    parts: [{ text: "Hello" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hi there! I can assist you with our additional services. What would you like to do?" }],
                },
            ];
        case 'transferFund':
            return [
                {
                    role: "user",
                    parts: [{ text: "Hello" }],
                },
                {
                    role: "model",
                    parts: [{
                        text: "Hello! I can help you transfer funds. May I have the account name or number you wish to transfer to?"
                    }],
                },
            ];
        default:
            return [];
    }
}

// Page-specific functions that call the generic startChat function
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

async function startChatForTransferFund(req, res) {
    return startChat(req, res, 'transferFund');
}

module.exports = {
    startChatForHomePage,
    startChatForFingerPrint,
    startChatForLoginPage,
    startChatForMoreServices,
    startChatForTransferFund,
};

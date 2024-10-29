const geminiChatModel = require("../geminiChatConfig.js");

let history = [];

async function startChatForUser(req, res) {
    let userChat = req.body.userInput;

    try {
        let geminiChat;
        console.log(history);
        if (history.length > 0) {
            
            geminiChat = geminiChatModel.startChat({
                history: history,
            });
        } else {
            
            geminiChat = geminiChatModel.startChat({ 
                history: [
                    {
                      role: "user",
                      parts: [{ text: "Hello" }],
                    },
                    {
                      role: "model",
                      parts: [{ text: "Nice to meet you! What would you like to do today?" }],
                    },
                  ],
            });
        }
        
        let result = await geminiChat.sendMessageStream(userChat);
        let responseText = '';
        for await (const chunk of result.stream){
            const chunkText = chunk.text();
            process.stdout.write(chunkText);
            responseText += chunkText
        }
       
  

        if (responseText !== '') {
            history.push({
                role: "user",
                parts: [{text: userChat}], 
            });
    
            history.push({
                role: "model",
                parts: [{text: responseText}], 
            });
        }
        
        return res.status(200).json({ responseText });
    } catch (error) {
        console.error('Error starting chat for user:', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    startChatForUser,
};

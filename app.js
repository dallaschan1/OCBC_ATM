const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('dotenv').config();
const API_KEY = process.env.GEMINI_API_KEY;
const app = express();
const PORT = 3001;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); 


let conversationHistory = [];
app.post('/api/converse', async (req, res) => {
  const userInput = req.body.userInput;
  conversationHistory.push({ role: 'user', content: userInput });
  if (!userInput) {
    return res.status(400).json({ error: 'User input is required' });
  }

  try {
    // Build prompt for Gemini
    const historyString = conversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
    const prompt = `You are a friendly AI assistant integrated with an ATM that can make conversation, with the capability to directly control the ATM screen by issuing commands. You have a set of specific phrases to control the ATM, such as allowing the user to select options or perform actions directly by returning specific phrases.
    The available functions the ATM has are:
    - Convert Currency: Allows for exchange of currency.
    - Crypto Currency Services: Enables you to buy, sell, and transfer your tokens between wallets.
    - Pay Bills: Allow payments for utilities, loans, credit cards, insurance, government fees, town council, school fees, memberships, and fines.
    - Transfer Fund: Allow transfer of money between your accounts or to other bank accounts.
    - Savings or Loan Details: Currently unavailable.
    - Update Personal Particulars: Enables you to change your contact details and mailing address.
    - Deposit Money: Allows you to deposit money into your account.
    - Withdraw Money: Allows you to withdraw cash from your account.
    - Check Account Balance: Allows you to check the balance of your accou
    Explain to the user on the functions if they are unsure of the available functions or return the following phrases word for word ONLY for each option in chronological order if you are very sure it is the option that they want to do:
    1. return "Convert Currency 1"
    2. return "Crypto Currency Services 2"
    3. return "Pay Bills 3"
    4. return "Transfer Fund 4"
    5. return "Savings or Loan Details 5"
    6. return "Update Personal Particulars 6"
    7. return "Deposit Money 7"
    8. return "Withdraw Money 8"
    9. return "Check Account Balance 9"

    Example of how to reply:
    User: "My mother gave me 5 dollar to put in the atm what do i do"
    You: "It seems like your mother gave you money to deposit. You can deposit money into your account by selecting the 'Deposit Money' option on the ATM. Would you like me to proceed with that?"
    User: "what does deposit money mean?"
    You: "Deposit money means to put money into your account for safekeeping. Would you like me to proceed?"
    User: "Yes"
    You:"Deposit Money 7"

    Assuming the user ask u the functions, simply name all the functions without the descriptions unless user specified otherwise.

    IMPORTANT: Remember to always confirm with the user before proceeding with any of those phrases, dont add AI: infront of ur response and ensure your messages are all safe and friendly.
    Conversation History:
    ${historyString}
    User input: "${userInput}".`;

    // Send the prompt to Gemini for response generation
    const result = await model.generateContent(prompt);
    const aiResponse = result.response?.text()?.trim() ?? "I'm not sure what you mean. Could you please rephrase?";

    conversationHistory.push({ role: 'AI', content: aiResponse });
    // Return the response to the client
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error while fetching Gemini AI response:', error);
    res.status(500).json({ error: 'Could not get a response from Gemini AI.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
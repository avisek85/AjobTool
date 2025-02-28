const { OpenAI} = require('openai');
// const userData = require('./userData.json');
require('dotenv').config();

// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
//   });

// const openai = new OpenAI();


async function generateAnswer(question){

    try {
        question = question.toLowerCase();
        const answerMap = {
            phone: '9876543210',
            contact: '9876543210',
            email: 'example@example.com',
            date: '1990-01-01',
            birth: '1990-01-01',
            experience: '2',
            work: '2',
            exp: '2',
            notice: '0',
            period: '0',
            ctc: '500000',
            expected: '500000',
            available: 'yes',
            relocate: 'yes',
            valid:'yes'
          };

          for(const [keyword,answer] of Object.entries(answerMap)){
            if(question.includes(keyword)){
                return answer;
            }
          }

          return "Not specified";



        // const client = new OpenAI({
        //     baseURL: "https://models.inference.ai.azure.com",
        //     apiKey: process.env.OPENAI_API_KEY
        //   });

        /*

          if (question.includes('phone') || question.includes('contact')) {
            // Return a dummy phone number (adjust as needed)
            return '9876543210';
        }
        // Check for email-related questions
        else if (question.includes('email')) {
            // Return a dummy email address
            return 'example@example.com';
        }
        // Check for date-related questions (e.g., birthdate)
        else if (question.includes('date') || question.includes('birth')) {
            // Return a formatted date (adjust as needed)
            return '1990-01-01';
        }
        else if (question.includes('experience') || question.includes('work') || question.includes('exp'))  {
            // Return a formatted date (adjust as needed)
            return '2';
        }
        else if (question.includes('notice') || question.includes('period')) {
            // Return a formatted date (adjust as needed)
            return '0';
        } else if (question.includes('ctc') || question.includes('expected')) {
            // Return a formatted date (adjust as needed)
            return '500000';
        }else if (question.includes('available') || question.includes('relocate')) {
            // Return a formatted date (adjust as needed)
            return 'yes';
        }else{
            return "Not specified";
        }
        //ai answer is not good
        // else{
        //     const prompt = `Question: ${question}\nBased on this user's data: ${JSON.stringify(userData)}\nProvide required professional answer: `;
        //     const response = await client.chat.completions.create({
        //         model: "gpt-4o",
        //         messages: [
        //           { role: "system", content: "You are a professional assistant for job applications." },
        //           { role: "user", content: prompt }
        //         ],
        //         max_tokens: 50,
        //         temperature: 0.7
        //       });
        //     const answer = response?.choices[0].message.content.trim();
        //     console.log(`Generated Answer: ${answer}`);
        //     return answer;
        // }

        */

       
    } catch (error) {
        console.error("Error generating answer1 :", error);
        return '';
    }
}

module.exports = generateAnswer;
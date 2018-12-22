// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// greeting.js defines the greeting dialog

// Import required Bot Builder
const { ComponentDialog, WaterfallDialog, TextPrompt, ChoicePrompt, NumberPrompt } = require('botbuilder-dialogs');

// User state for greeting dialog
const { UserProfile } = require('../dialogs/greeting/userProfile');

// Dialog IDs 
const PROFILE_DIALOG = 'profileDialog';
const HELLO_USER = 'hello_user';
const GET_NAME = 'get_name';

// Prompt IDs
// const CITY_PROMPT = 'cityPrompt';
const RATING = 'rating';
const NAME_PROMPT = 'name_prompt';
const CONFIRM_PROMPT = 'confirm_prompt';
const AGE_PROMPT = 'age_prompt';
const FULL_EXPERIENCE = 'full_experience';
const WAITER_RATING = 'waiter_rating';
const FOOD_RATING = 'food_rating';
const MENUE_RATING = 'menu_rating';
const RECOMMENDATION_RATING = 'recommendation_rating';

const VALIDATION_SUCCEEDED = true;
const VALIDATION_FAILED = !VALIDATION_SUCCEEDED;

/**
 * Demonstrates the following concepts:
 *  Use a subclass of ComponentDialog to implement a multi-turn conversation
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *
 * @param {String} dialogId unique identifier for this dialog instance
 * @param {PropertyStateAccessor} userProfileAccessor property accessor for user state
 */
class Ratings extends ComponentDialog {
    constructor(dialogId, userProfileAccessor) {
        super(dialogId);

        // validate what was passed in
        if (!dialogId) throw ('Missing parameter.  dialogId is required');
        if (!userProfileAccessor) throw ('Missing parameter.  userProfileAccessor is required');


        // Create a dialog that asks the user for their name.
        this.addDialog(new WaterfallDialog(RATING, [
            this.promptOveralExp.bind(this),
            this.promptWaiter.bind(this),
            this.promptFood.bind(this),
            this.promptMenue.bind(this),
            this.promptRcommendation.bind(this),
            this.initializeStateStep.bind(this),
            this.promptForName.bind(this),
            // this.captureName.bind(this),
            // this.confirmAgePrompt.bind(this),
            // this.promptForAge.bind(this),
            // this.captureAge.bind(this),
            // this.displayProfile.bind(this)
        ]));
        // Create a dialog that displays a user name after it has been collected.
        this.dialogs.add(new WaterfallDialog(GET_NAME, [
            this.captureName.bind(this)
        ]));
        // Create a dialog that displays a user name after it has been collected.
        this.dialogs.add(new WaterfallDialog(HELLO_USER, [
            this.displayProfile.bind(this)
        ]));

        // Add prompts that will be used by the main dialogs.
        this.addDialog(new ChoicePrompt(FULL_EXPERIENCE));
        this.addDialog(new ChoicePrompt(WAITER_RATING));
        this.addDialog(new ChoicePrompt(FOOD_RATING));
        this.addDialog(new ChoicePrompt(MENUE_RATING));
        this.addDialog(new ChoicePrompt(RECOMMENDATION_RATING));

        this.addDialog(new TextPrompt(NAME_PROMPT));
        // this.addDialog(new ChoicePrompt(CONFIRM_PROMPT));
        // this.addDialog(new NumberPrompt(AGE_PROMPT, async (prompt) => {
        //     if (prompt.recognized.succeeded) {
        //         if (prompt.recognized.value <= 0) {
        //             await prompt.context.sendActivity(`Your age can't be less than zero.`);
        //             return false;
        //         } else {
        //             return true;
        //         }
        //     }

        //     return false;
        // }));

        // Save off our state accessor for later use
        this.userProfileAccessor = userProfileAccessor;
        this.survey_result = new Map();
    }

    // Promp asking about the overal experience
    async promptOveralExp(step) {
        return await step.prompt(FULL_EXPERIENCE, `How was your overal experience ? on a scale from 1 to 5`, ['1','2','3','4','5']);
    }

    // Promp asking about the overal experience
    async promptWaiter(step) {
        if (step.result) {
            this.survey_result.set(FULL_EXPERIENCE, step.result.value);
        }
        return await step.prompt(WAITER_RATING, `How was your waiteress / waiter ? on a scale from 1 to 5`, ['1','2','3','4','5']);
    }

    async promptFood(step) {
        if (step.result) {
            this.survey_result.set(WAITER_RATING, step.result.value);
        }
        return await step.prompt(FOOD_RATING, `How was your dish ? on a scale from 1 to 5`, ['1','2','3','4','5']);
    }

    //
    async promptMenue(step) {
        if (step.result) {
            this.survey_result.set(FOOD_RATING, step.result.value);
        }
        return await step.prompt(MENUE_RATING, `How was the menue ? on a scale from 1 to 5`, ['1','2','3','4','5']);
    }

    // Promp asking about the venue
    async promptRcommendation(step) {
        if (step.result) {
            this.survey_result.set(MENUE_RATING, step.result.value);
        }
        return await step.prompt(RECOMMENDATION_RATING, `How likely are you to recommend us to friend or family ? on a scale from 1 to 5`, ['1','2','3','4','5']);
    }

    // 
    async initializeStateStep(step) {
        let userProfile = await this.userProfileAccessor.get(step.context);
        if (userProfile === undefined) {
            if (step.options && step.options.userProfile) {
                await this.userProfileAccessor.set(step.context, step.options.userProfile);
            } else {
                await this.userProfileAccessor.set(step.context, new UserProfile());
            }
        }
        return await step.next();
    }

    // This step in the dialog prompts the user for their name.
    async promptForName(step) {
        if (step.result) {
            this.survey_result.set(RECOMMENDATION_RATING, step.result.value);
        }
        // return await step.prompt(NAME_PROMPT, `What is your name?`);

        const userProfile = await this.userProfileAccessor.get(step.context);
        // if we have everything we need, greet user and return
        if (userProfile !== undefined && userProfile.name !== undefined) {
            return await this.greetUser(step);
        }
        if (!userProfile.name) {
            // prompt for name, if missing
            return await step.prompt(NAME_PROMPT, 'What is your name?');
        } else {
            return await step.next();
        }
        
    }

    async captureName(step) {
        // save name, if prompted for
        const userProfile = await this.userProfileAccessor.get(step.context);
        if (userProfile.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            userProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.userProfileAccessor.set(step.context, userProfile);
        }
        await context.sendActivity(`Thank you for taking this survey!`);
        // return await step.next();
    }

    // This step captures the user's name, then prompts whether or not to collect an age.
    async confirmAgePrompt(step) {
        // save name, if prompted for
        const userProfile = await this.userProfileAccessor.get(step.context);
        if (userProfile.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            userProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.userProfileAccessor.set(step.context, userProfile);
        }
        // const user = await this.userProfile.get(step.context, {});
        // user.name = step.result;
        // await this.userProfile.set(step.context, user);
        await step.prompt(CONFIRM_PROMPT, 'Do you want to give your age?', ['yes', 'no']);
        return await step.next();
    }

    // This step checks the user's response - if yes, the bot will proceed to prompt for age.
    // Otherwise, the bot will skip the age step.
    async promptForAge(step) {
        if (step.result && step.result.value === 'yes') {
            return await step.prompt(AGE_PROMPT, `What is your age?`,
                {
                    retryPrompt: 'Sorry, please specify your age as a positive number or say cancel.'
                }
            );
        } else {
            return await step.next(-1);
        }
    }

    // This step captures the user's age.
    async captureAge(step) {
        const user = await this.userProfile.get(step.context, {});
        if (step.result !== -1) {
            user.age = step.result;
            await this.userProfile.set(step.context, user);
            await step.context.sendActivity(`I will remember that you are ${ step.result } years old.`);
        } 
        else {
            await step.context.sendActivity(`No age given.`);
        }
        return await step.endDialog();
    }

    // This step displays the captured information back to the user.
    async displayProfile(step) {
        const user = await this.userProfile.get(step.context, {});
        const survey_result = await this.survey_result;
        const results = "" ;
        for(let e in survey_result.values()) {
            results += e; 
        };
        
        await step.context.sendActivity(`Your name is ${ user.name } and you did not share your age.`);
        await step.context.sendActivity(`Thank you!! you gave these ratings ${ results }`);
        return await step.endDialog();
    }
}

exports.RatingDialog = Ratings;

/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */

// IMPORTANT: Please note that this template uses Dispay Directives,
// Display Interface for your skill should be enabled through the Amazon developer console
// See this screenshot - https://alexa.design/enabledisplay

const Alexa = require('ask-sdk-core');
const rp = require('request-promise');
const cheerio = require('cheerio');
const webshot = require('webshot');

/* INTENT HANDLERS */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(welcomeMessage)
            .reprompt(helpMessage)
            .getResponse();
    },
};

const DefinitionHandler = {
    canHandle(handlerInput) {
        console.log("Inside DefinitionHandler");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' &&
            request.intent.name === 'AnswerIntent';
    },
    handle(handlerInput) {
        console.log("Inside DefinitionHandler - handle");

        //GRABBING ALL SLOT VALUES AND RETURNING THE MATCHING DATA OBJECT.
        const distance = getItem(handlerInput.requestEnvelope.request.intent.slots);
        const response = handlerInput.responseBuilder;

        return rp({
            uri: `https://runkeeper.com/search/routes?lon=-79.3966091&lat=43.6492136&distance=${distance}`,
            transform: function(body) {
                return cheerio.load(body);
            }
        })
        .then(($) => {

            // image list
            var imgs = ['https://preview.ibb.co/c6ju78/1.png',
                        'https://preview.ibb.co/dEPGLT/2.png',
                        'https://image.ibb.co/jRK5Eo/3.png',
                        'https://image.ibb.co/nPYXuo/4.png',
                        'https://preview.ibb.co/inYAfT/5.png',
                        'https://preview.ibb.co/n3xE78/6.png']
            // get list of routes
            var routes = []
            $('.routeResultTile').each(function(i, ele) {
                var tmp = {}
                tmp.url = $(this).find('.thumbnailUrl')[0].attribs.href
                tmp.distance = $(this).find('.routeDistanceLabel').text().trim()
                tmp.owner = $(this).find('.routesuteOwnwer').text()
                tmp.id = tmp.url.split('/').pop()
                tmp.img_url = imgs[i]
                routes.push(tmp)
            });

            if (routes.length > 0) {

              var rindex = parseInt(Math.random()*4)
              var textDesription = `Route Length ${routes[rindex].distance} `

              //IF THE DATA WAS FOUND
              if (useCardsFlag) {
                  response.withStandardCard(
                      getCardTitle(),
                      textDesription,
                      imgs[rindex],
                      imgs[rindex])
              }
              // if (supportsDisplay(handlerInput)) {
                  const image = new Alexa.ImageHelper().addImageInstance(imgs[rindex]).getImage();
                  //https://fakeimg.pl/350x200/ff0000/000
                  const testImage = new Alexa.ImageHelper().addImageInstance('https://fakeimg.pl/1024x800/ff0000/000').getImage();
                  const title = getCardTitle();
                  const primaryText = new Alexa.PlainTextContentHelper().withPrimaryText(textDesription).getTextContent();
                  response.addRenderTemplateDirective({
                      type: 'BodyTemplate6',
                      backButton: 'visible',
                      backgroundImage: image,
                      image: testImage,
                      textContent: primaryText,
                  }); 

                  console.log("tks8");
              // }

                return response.speak(`Route for ${routes[rindex].distance} looks good. Would you like to send an email about it?`)
                    .reprompt(repromptSpeech)
                    .getResponse();
            } else {
                return response.speak(`No Routes Found. Try saying it again!`)
                    .reprompt(repromptSpeech)
                    .getResponse();
            } 

            console.log('here now tks succcess')
        })
        .catch((err) => {
          console.log('here now tks error')
            return response.speak(errMessage)
                    .reprompt(repromptSpeech)
                    .getResponse();
        }); 
 
    }
};

const EmailHandler = {
    canHandle(handlerInput) {
        console.log("Inside EmailIntent");
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
            request.intent.name === 'EmailIntent';
    },
    handle(handlerInput) {
        console.log("Inside EmailIntent - handle");
        return handlerInput.responseBuilder
            .speak(emailSkillMessage)
            .getResponse();
    },
};

const HelpHandler = {
    canHandle(handlerInput) {
        console.log("Inside HelpHandler");
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
            request.intent.name === 'AMAZON.HelpHandler';
    },
    handle(handlerInput) {
        console.log("Inside HelpHandler - handle");
        return handlerInput.responseBuilder
            .speak(helpMessage)
            .reprompt(helpMessage)
            .getResponse();
    },
};

const ExitHandler = {
    canHandle(handlerInput) {
        console.log("Inside ExitHandler");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const request = handlerInput.requestEnvelope.request;

        return request.type === `IntentRequest` && (
            request.intent.name === 'AMAZON.StopIntent' ||
            request.intent.name === 'AMAZON.PauseIntent' ||
            request.intent.name === 'AMAZON.CancelIntent'
        );
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(exitSkillMessage)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        console.log("Inside SessionEndedRequestHandler");
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        console.log("Inside ErrorHandler");
        return true;
    },
    handle(handlerInput, error) {
        console.log("Inside ErrorHandler - handle");
        console.log(`Error handled: ${JSON.stringify(error)}`);
        console.log(`Handler Input: ${JSON.stringify(handlerInput)}`);

        return handlerInput.responseBuilder
            .speak(errMessage)
            .reprompt(repromptSpeech)
            .getResponse();
    },
};

/* CONSTANTS */
const skillBuilder = Alexa.SkillBuilders.custom();
const imagePath = "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/{0}x{1}/{2}._TTH_.png";
const backgroundImagePath = "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/{0}x{1}/{2}._TTH_.png"
const speechConsCorrect = ['Booya', 'All righty', 'Bam', 'Bazinga', 'Bingo', 'Boom', 'Bravo', 'Cha Ching', 'Cheers', 'Dynomite', 'Hip hip hooray', 'Hurrah', 'Hurray', 'Huzzah', 'Oh dear.  Just kidding.  Hurray', 'Kaboom', 'Kaching', 'Oh snap', 'Phew', 'Righto', 'Way to go', 'Well done', 'Whee', 'Woo hoo', 'Yay', 'Wowza', 'Yowsa'];
const speechConsWrong = ['Argh', 'Aw man', 'Blarg', 'Blast', 'Boo', 'Bummer', 'Darn', "D'oh", 'Dun dun dun', 'Eek', 'Honk', 'Le sigh', 'Mamma mia', 'Oh boy', 'Oh dear', 'Oof', 'Ouch', 'Ruh roh', 'Shucks', 'Uh oh', 'Wah wah', 'Whoops a daisy', 'Yikes'];
const data = [
    { StateName: 'New York', Abbreviation: 'NC', Capital: 'Raleigh', StatehoodYear: 1789, StatehoodOrder: 12 }
];

const welcomeMessage = `Welcome to Route Genius! How long you wanna run today?`;
const emailSkillMessage = `Email Sent. Thank you for using Route Genius. I hope you enjoy the run!`;
const exitSkillMessage = `Thank you for using Route Genius. I hope you enjoy the run!`;
const repromptSpeech = `repromptSpeech How long you wanna run today?`;
const helpMessage = `helpMessage How long you wanna run today?`;
const errMessage = `oh no, I got in to some error while finding the running routes!`;
const useCardsFlag = true;

/* HELPER FUNCTIONS */

// returns true if the skill is running on a device with a display (show|spot)
function supportsDisplay(handlerInput) {
    var hasDisplay =
        handlerInput.requestEnvelope.context &&
        handlerInput.requestEnvelope.context.System &&
        handlerInput.requestEnvelope.context.System.device &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
    return hasDisplay;
}

function getCardTitle(item) {
    return 'Route Suggestion';
}

function getSmallImage(item) {
    return `https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/720x400/CA._TTH_.png`;
}

function getLargeImage(item) {
    return `https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/1200x800/CA._TTH_.png`;
}

function getImage(height, width, label) {
    return imagePath.replace("{0}", height)
        .replace("{1}", width)
        .replace("{2}", label);
}

function getBackgroundImage(label, height = 1024, width = 600) {
    return backgroundImagePath.replace("{0}", height)
        .replace("{1}", width)
        .replace("{2}", label);
}

function getSpeechDescription(item) {
    return `${item.StateName} is the ${item.StatehoodOrder}th state, admitted to the Union in ${item.StatehoodYear}.  The capital of ${item.StateName} is ${item.Capital}, and the abbreviation for ${item.StateName} is <break strength='strong'/><say-as interpret-as='spell-out'>${item.Abbreviation}</say-as>.  I've added ${item.StateName} to your Alexa app.  Which other state or capital would you like to know about?`;
}


function getItem(slots) {
    const propertyArray = Object.getOwnPropertyNames(data[0]);
    let slotValue;

    for (const slot in slots) {
        if (Object.prototype.hasOwnProperty.call(slots, slot) && slots[slot].value !== undefined) {
            slotValue = slots[slot].value;
            for (const property in propertyArray) {
                if (Object.prototype.hasOwnProperty.call(propertyArray, property)) {
                    const item = data.filter(x => x[propertyArray[property]]
                        .toString().toLowerCase() === slots[slot].value.toString().toLowerCase());
                    if (item.length > 0) {
                        return item[0];
                    }
                }
            }
        }
    }
    return slotValue;
}


function getTextDescription(item) {
    let text = '';

    for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
            text += `${formatCasing(key)}: ${item[key]}\n`;
        }
    }
    return text;
}

function formatCasing(key) {
    return key.split(/(?=[A-Z])/).join(' ');
}
 

/* LAMBDA SETUP */
exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        DefinitionHandler,
        EmailHandler,
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
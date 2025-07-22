let step = 0;
let errorCount = 0;
let silenceTimer = null;

const chatBox = document.getElementById("chat-box");

function appendMessage(sender, text) {
  const message = document.createElement("div");
  message.className = sender;
  message.innerText = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function normalizeInput(input) {
  // Simple fuzzy matching for common yes/no typos
  input = input.toLowerCase().trim();
  if (["y", "yes", "yeah", "yep", "yess"].includes(input)) return "yes";
  if (["n", "no", "nah", "nope"].includes(input)) return "no";
  return input;
}

function containsEmoji(text) {
  // Rough emoji detection using Unicode ranges
  return /[\u{1F300}-\u{1FAFF}]/u.test(text);
}

function containsUnsupportedLanguage(text) {
  // Detect non-ASCII letters - simplistic approach
  return /[^\x00-\x7F]+/.test(text) && !containsEmoji(text);
}

function isLikelyMultiQuestion(text) {
  // Detect multiple question marks or conjunctions like 'and'
  return (text.match(/\?/g) || []).length > 1 || /\band\b/.test(text);
}

function isAngryOrRude(text) {
  // Detect all caps or common swear words (simplified)
  const swearWords = ["damn", "shit", "fuck", "crap", "bitch", "asshole"];
  const lowerText = text.toLowerCase();
  if (text === text.toUpperCase() && text.length > 3) return true;
  return swearWords.some(word => lowerText.includes(word));
}

function isValidTrackingNumber(input) {
  // Check tracking number format strictly: 2 letters + 9 digits + 2 letters
  return /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(input);
}

function isValidEmail(input) {
  // Simple email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

function isValidOrderNumber(input) {
  // Simple order number: digits only and length 6-12
  return /^\d{6,12}$/.test(input);
}

function clearSilenceTimer() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
}

function startSilenceTimer() {
  clearSilenceTimer();
  silenceTimer = setTimeout(() => {
    appendMessage("bot", "Are you still there? Let me know if you need help.");
  }, 30000); // 30 seconds of silence triggers reminder
}

function respond(rawInput) {
  clearSilenceTimer();
  startSilenceTimer();

  let input = normalizeInput(rawInput);

  // Handle empty input
  if (!input && step > 0) {
    appendMessage("bot", "I didn’t catch that. Could you please reply?");
    return;
  }

  // Handle unsupported language or emoji-only inputs
  if (containsUnsupportedLanguage(input)) {
    appendMessage("bot", "Sorry, I currently support English only. Could you please type your message in English?");
    return;
  }

  if (containsEmoji(input) && input.length <= 3) {
    appendMessage("bot", "I see emojis! Could you please type your message using words?");
    return;
  }

  // Handle multi-question inputs
  if (isLikelyMultiQuestion(input)) {
    appendMessage("bot", "I want to help with each question separately. Could you please ask one question at a time?");
    return;
  }

  // Handle angry or rude inputs calmly
  if (isAngryOrRude(rawInput)) {
    appendMessage("bot", "I’m here to help. Let’s work together to solve your issue.");
    return;
  }

  // Main conversation flow
  switch (step) {
    case 0:
      appendMessage("bot", "Hi! I can help you track your lost package. Do you have a tracking number? (yes/no)");
      step = 1;
      break;

    case 1:
      if (input === "yes") {
        appendMessage("bot", "Great! Please enter your tracking number (e.g., AB123456789CD).");
        step = 2;
        errorCount = 0;
      } else if (input === "no") {
        appendMessage("bot", "No problem. Please provide your order number or the email used during purchase.");
        step = 3;
      } else {
        appendMessage("bot", "Please reply with 'yes' or 'no'.");
      }
      break;

    case 2:
      if (isValidTrackingNumber(rawInput)) {
        appendMessage("bot", "Tracking... 📦 Your package is in transit. Estimated delivery: July 25, 2025.");
        step = 99;
      } else {
        errorCount++;

        if (rawInput.length < 10) {
          appendMessage("bot", "That looks a bit short. Tracking numbers are usually at least 10 characters.");
        } else if (rawInput.length > 25) {
          appendMessage("bot", "That seems too long. Can you double-check your tracking number?");
        } else if (/[^a-zA-Z0-9]/.test(rawInput)) {
          appendMessage("bot", "Tracking numbers only use letters and numbers. Please try again.");
        } else if (rawInput.includes("http")) {
          appendMessage("bot", "That looks like a URL, not a tracking number. Please enter just the tracking number.");
        } else {
          appendMessage("bot", "Hmm, that doesn't look right. A tracking number looks like AB123456789CD. Please try again.");
        }

        if (errorCount >= 3) {
          appendMessage("bot", "I'm having trouble reading the tracking number. Would you like to talk to a human agent?");
          step = 4;
        }
      }
      break;

    case 3:
      if (isValidEmail(rawInput) || isValidOrderNumber(rawInput)) {
        appendMessage("bot", "Thanks! Found your package. It is currently at the sorting center.");
        step = 99;
      } else {
        appendMessage("bot", "I couldn’t find it with that info. Would you like to talk to a human agent?");
        step = 4;
      }
      break;

    case 4:
      if (input === "yes") {
        appendMessage("bot", "Connecting you to a live agent... 👨‍💼 Please wait.");
        step = 99;

        setTimeout(() => {
          appendMessage("bot", "An employee will contact you shortly via a phone call on your registered mobile number. 📞");
        }, 2000);
      } else {
        appendMessage("bot", "Okay! Let me know if you need anything else.");
        step = 99;
      }
      break;

    default:
      appendMessage("bot", "Thanks for using the package tracker bot! Refresh to start over.");
  }
}

function handleUserInput() {
  const inputField = document.getElementById("user-input");
  const userText = inputField.value.trim();
  if (!userText) return;

  appendMessage("user", userText);
  inputField.value = "";

  setTimeout(() => respond(userText), 600);
}

// Start the conversation automatically and start silence timer
window.onload = () => {
  respond("");  // triggers case 0 message
  startSilenceTimer();
};

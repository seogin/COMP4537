import USER_MESSAGES from "../lang/messages/en/user.js";


class Read{
    constructor(key){
        this.key = key;
    }
    if (typeof(Storage) == "undefined") {
        document.getElementById("reader").innerText = USER_MESSAGES.MESSAGE_NOT_SUPPORTED;
        window.stop();
    }

}

document.getElementById("reader").innerText = USER_MESSAGES.WEB_TITLE;
module.exports = {
    SHOW_TOS_PROMPT_DM: `Hi! I'm Jonquil 🌼\nTo use my services, please read and accept our Terms of Service ({tosUrl}).\n\nReply with 'ACCEPT' to continue.`,
    
    SHOW_TOS_PROMPT_DM_TG: `Hi! I'm Jonquil 🌼\nTo use my services, please read and accept our Terms of Service ({tosUrl}).\n\nReply with 'ACCEPT' or click /accept to continue.`,

    SHOW_TOS_PROMPT_GROUP: `Hi {userName}! I'm Jonquil 🌼, the assistant in the *"{groupName}"* group.\n\nYou called me there, but to use my services, you need to accept our Terms of Service ({tosUrl}).\n\nIf you agree, please reply here with 'ACCEPT'.`,

    SHOW_TOS_PROMPT_GROUP_FALLBACK: `Hi! You called me in a group, but to use my services, you need to accept our Terms of Service ({tosUrl}).\n\nPlease reply here with 'ACCEPT'.`,

    TOS_APPROVED_SUCCESS: "✅ Awesome! You've accepted the terms. How can I help you today?"
};
/* Mock data matching exactly what's in the Stitch design */

export const MOCK_CHATS = [
  {
    id: 'new',
    title: 'New Chat — Ready',
    subtitle: 'Paste YouTube Link to Begin',
    icon: 'play_arrow',
    iconColor: 'primary',
    isActive: true,
  },
  {
    id: 'isro',
    title: 'Ranveer Allahbadia podcast w/ ISRO Scientist',
    lang: 'HI',
    langClass: 'tertiary',
    duration: '1h 24m',
    icon: 'rocket_launch',
    iconColor: 'tertiary',
    isActive: false,
  },
  {
    id: 'karpathy',
    title: "Andrej Karpathy: Let's build GPT from scratch",
    lang: 'EN',
    langClass: 'secondary',
    duration: '2h 12m',
    icon: 'memory',
    iconColor: 'secondary',
    isActive: false,
  },
  {
    id: 'khan',
    title: 'Khan GS Research: Geopolitics breakdown',
    lang: 'HI',
    langClass: 'tertiary',
    duration: '38m',
    icon: 'public',
    iconColor: 'tertiary',
    isActive: false,
  },
];

export const MOCK_TRENDING = [
  {
    id: 'isro_space',
    url: 'https://www.youtube.com/watch?v=ISRO_2025_Mission',
    title: 'ISRO Space Tech & Gaganyaan Roadmap',
    channel: 'Ranveer Allahbadia ft. Dr. Sreedhara',
    duration: '1:24:18',
    lang: 'HI / EN',
    langClass: 'hi-en',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDV6JgMB0IVE17yfuVX36k280MMOCSbRq3pQcJxnaHojdkVtHWaztGSCnJnUMXZZB0tog7U9H5yxH5vU3Tc1VHH93Vtncx-5bXsJ7E-ZpulwaXXfiuHgvazVw279sCs2_QvkB9AOAOfwEgr7lfg-i-GomGxZhg4zUugRsiT6bUFjm9kbVTQRUaFiT19BWv1TXBdoOkzmaD7v9ZbVgJO5V_dLkJDn2MngzrPIccGryremvOJUs7tYgHn',
  },
  {
    id: 'gpt_karpathy',
    url: 'https://www.youtube.com/watch?v=GPT_From_Scratch_Karpathy',
    title: "Let's build GPT from scratch: Code Deep Dive",
    channel: 'Andrej Karpathy Neural Networks Zero to Hero',
    duration: '2:12:45',
    lang: 'EN',
    langClass: 'en',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdY3P5Zl8Jvll-h6jlN5zD5gC4UMLA1vw3n9c6rhL7QXVEWhOamEp5I-4pBtxpl9cL6xgmUEkSUzu3XCen7tPWbbpZeqlsc8a8ckWQclmE3UQlroVmocSYixJf4eMhT7NqDkIJmIM0ygg3VjwyXXKunGp70vPvJ12l1S0j9oIgATuil8Dg2hv8WPBF_dVNpy__ngUaoDF1F3A4sAUGqbxKdjYQgeFWbJT_iulw84q6mKZwDqck-SLu',
  },
  {
    id: 'geopolitics',
    url: 'https://www.youtube.com/watch?v=Geopolitics_Khan_Sir',
    title: 'Global Semiconductor War & India Impact',
    channel: 'Khan GS Research Centre Strategic Brief',
    duration: '38:40',
    lang: 'HI',
    langClass: 'hi',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJSxyjMUnjYzk4E1aoQTn9VTIvNSNDtgHP2dkbCDcwZ-svmN_V-RzblvJBKLQjbfrv9STj8kto9a8ptqJ0gXKOM1ED-u1cpae9m6EunOTEchUmnLvMdg7fbVTLrJ6eELpdavbz-RllP7pGlf7qCQa3cp19TeokV104IOU0x0h6rDuse9JY5HaQBz70LMksTi7lmGkUf_gwjUNgl0VC2N5PvB-PsnMzgqVPzsWbi89FhlRSymeWmUr7',
  },
];

export const MOCK_QUICK_TRIES = [
  {
    url: 'https://www.youtube.com/watch?v=2X_2IdriWHg',
    label: 'Gita Summary (Hindi)',
    dotClass: 'pill-dot-tertiary',
  },
  {
    url: 'https://www.youtube.com/watch?v=f3lUEnMaiAU',
    label: 'Lex Fridman #400',
    dotClass: 'pill-dot-secondary',
  },
  {
    url: 'https://www.youtube.com/watch?v=0k1JzC3vY9M',
    label: 'Dhruv Rathee AI Explainer',
    dotClass: 'pill-dot-primary-c',
  },
];

export const MOCK_VIDEO = {
  title: 'Khan Sir Patna: Chandrayaan 3 Mission Explained (ISRO)',
  channel: 'Khan GS Research Centre',
  views: '14.8M views',
  duration: '42:18',
  lang: 'HI Audio',
  mode: 'Hinglish AI Mode',
  thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJxe0bM1RCxQsfb4yE1oEjnDJzuscOieSTIMX8esQEZ30l0JcOC4IPgseNUo9QnTQIOfXlLeUi-uwj_0bU1-PBVoa1W8h_q8Jzr8HvB3F_XkvsEOllmI9-CHjn7MWwkwxnG2STZFigOJVpa7dpCvNnBc99PaTDZllCrXuOrwvrok14jk-za6PpYWqDGL3Jut69Qps5ZFNw-jhrwsmWAiNvyI5fM3XiVe8SPEsAoNgqyYqmT7pZ_TKt',
  url: 'https://youtube.com',
};

export const MOCK_STARTER_CHIPS = [
  { emoji: '✨', label: 'Summarize this video in 3 points' },
  { emoji: '🎯', label: 'What are the 3 key milestones mentioned?' },
  { emoji: '⏱️', label: 'Explain the landing maneuver at 24:15' },
  { emoji: '💰', label: 'Budget breakdown vs Hollywood' },
];

export const MOCK_MESSAGES = [
  {
    id: 1,
    type: 'user',
    text: 'Can you summarize the main launch stages Khan Sir explained in Hindi?',
    time: '10:42 AM',
  },
  {
    id: 2,
    type: 'ai',
    time: '10:42 AM',
    engine: 'GPT-4o + Transcript Engine',
    intro: 'खान सर ने चंद्रयान-3 के मुख्य लॉन्च स्टेजेस (LVM3-M4 रॉकेट) को काफी सरल और व्यावहारिक अंदाज में समझाया है:',
    stages: [
      {
        num: 1,
        title: 'LVM3-M4 रॉकेट (Bahubali / Fat Boy)',
        ts: '04:15',
        desc: 'लॉन्च के पहले 2 मिनट (127 सेकंड) में दो सॉलिड स्ट्रैप-ऑन बूस्टर्स (<strong>S200</strong>) लगभग 400 टन थ्रस्ट पैदा करके रॉकेट को आसमान में उठाते हैं और निर्धारित ऊंचाई पर अलग हो जाते हैं।',
      },
      {
        num: 2,
        title: 'Core Liquid Stage (L110 Vikas Engine)',
        ts: '14:32',
        desc: '108 सेकंड पर विकास (Vikas) लिक्विड इंजन प्रज्वलित होता है। यह चरण रॉकेट को घने वायुमंडल से बाहर निकालकर पृथ्वी की निचली कक्षा की दिशा में धकेलता है।',
      },
      {
        num: 3,
        title: 'Cryogenic Upper Stage (C25)',
        ts: '22:50',
        desc: 'लिक्विड हाइड्रोजन और लिक्विड ऑक्सीजन से चलने वाला यह सबसे तकनीकी इंजन है, जो अंतरिक्ष यान को सटीक दीर्घवृत्ताकार ट्रांसफर ऑर्बिट (<strong>170 x 36,500 km</strong>) में स्थापित करता है।',
      },
    ],
    callout: {
      title: 'खान सर का मुख्य विश्लेषण:',
      text: 'चंद्रयान-2 की सीख के आधार पर इस बार लैंडर के पैर अधिक मजबूत किए गए हैं और सेंसर फेलियर से बचने के लिए <strong>हजार्ड डिटेक्शन कैमरे 4 गुना बेहतर</strong> किए गए हैं ताकि 2x2 km के दायरे में किसी भी सुरक्षित बिंदु पर सॉफ्ट लैंडिंग हो सके।',
    },
    citations: [
      { ts: '04:15', label: 'LVM3 Overview' },
      { ts: '14:32', label: 'S200 Separation' },
      { ts: '22:50', label: 'Cryogenic Thrust' },
    ],
  },
  {
    id: 3,
    type: 'user',
    text: 'What is the cost comparison he made with Hollywood movies?',
    time: '10:44 AM',
  },
  {
    id: 4,
    type: 'ai-typing',
    searchText: 'Matching "Hollywood / Interstellar budget" at timestamp 31:40...',
  },
];

export const MOCK_LOADING_VIDEO = {
  title: 'The spelled-out intro to neural networks and backpropagation: building micrograd',
  shortTitle: 'Building micrograd',
  channel: 'Andrej Karpathy',
  videoId: 'kCc8FmEb1nY',
  duration: '2h 25m',
  durationFull: '2:25:10',
  lang: 'EN',
  url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
  thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcE_lZOkAUHopYsoVy6jCIzMjIStq3KPfBiN6se9rPsExTBvOaWYj2A8HuMXIrcN4ydC_YxDO86I9BdV3Cqw59LwQjtDNpQsKl-OgOnCNiXGKLwAZyRU69PWiylp7hLaGKFyDNzfOLm3NgSizi_fQheZdwMRntzBm6BMDOUtewMvS-rTWymqBau1K76NbaMCkT2xLyqNj6-EqgLnI2TcZ4ynOj9tMDL-42vbxrcVFGZ24VPCQItG01',
  ribbonThumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfRO61RdDW08J0Vsw211eXXk2pf8g7SBv9PcnBpat5uysIM90KuEdx3OqS9SpH-jVFz5nRHj8kK5ySNE0AIf25FURerc4Qu0IZzwXkGh4PPtanNo5HzRa41V14E4bu-Y7wc9FeXDR1FpA0FurGHPwXf4d88tpgbVROjWF3oZlPp8XTf3TT1x_yDmLXfCwk1Zr76nzOFRzHP2THfLmGIsJrafGt8pjzZuhioz-ZtsJqSgojNiVsnD1W',
};

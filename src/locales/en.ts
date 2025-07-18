
export const translationsEn = {
  common: {
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save Changes',
    close: 'Close',
    submit: 'Submit',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    noData: 'No Data',
    confirm: 'Confirm',
    actions: 'Actions',
    optional: 'Optional',
    all: 'All',
    language: 'Language',
    english: 'English',
    arabic: 'العربية',
    reset: 'Reset',
    advertisement: 'Advertisement',
  },
  header: {
    title: 'ScoreVerse',
    welcome: 'Welcome, {{username}}!',
    adminMode: 'Admin Mode',
    logout: 'Log out',
  },
  sidebar: {
    dashboard: 'Dashboard',
    addResult: 'Add Game Result',
    generateDraw: 'Generate Draw',
    leaderboards: 'Leaderboards',
    playerStats: 'Player Stats',
    matchHistory: 'Match History',
    tournaments: 'Tournaments',
    trophyRoom: 'Trophy Room',
    managePlayers: 'Manage Players',
    gameLibrary: 'Game Library',
    manageSpaces: 'Manage Spaces',
    manageUsers: 'Manage Users',
  },
  auth: {
    welcomeBack: 'Welcome Back!',
    joinScoreVerse: 'Join ScoreVerse!',
    loginPrompt: 'Log in to continue your ScoreVerse journey.',
    signupPrompt: 'Create an account to start tracking scores.',
    authError: 'Authentication Error',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    loginButton: 'Log In',
    signupButton: 'Sign Up',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    noAccount: "Don't have an account? Sign Up",
    hasAccount: 'Already have an account? Log In',
    processing: 'Processing...',
    invalidEmail: 'Please enter a valid email address.',
    passwordLength: 'Password must be at least 6 characters.',
    loginSuccess: 'Logged In',
    welcomeUser: 'Welcome back, {{username}}!',
    signupSuccess: 'Account Created',
    loginIssue: 'Login Issue: Your account exists, but your user profile could not be found. This can happen with very old accounts. Please sign up again or check Firestore security rules.',
    loginFailed: 'Login failed',
    invalidCredentials: 'Invalid email or password provided.',
    signupFailed: 'Failed to create account. Please try again.',
    emailInUse: 'This email address is already in use.',
  },
  dashboard: {
    title: 'Welcome back, {{username}}!',
    activeSpace: 'You are currently in the "{{spaceName}}" space.',
    noActiveSpace: 'You are currently in your Global context (no space selected).',
    globalContext: 'Global Context',
    shareSpace: 'Share',
    shareTitle: 'Share Your Data',
    shareDescription: 'Use the link below to share a live, read-only view of your stats. The link is permanent and updates automatically.',
    quickAccess: {
      recordMatch: 'Record New Match',
      recordMatchDesc: 'Log a recently played game.',
      leaderboards: 'View Leaderboards',
      leaderboardsDesc: 'See who is on top.',
      matchHistory: 'Match History',
      matchHistoryDesc: 'Review past games.',
      managePlayers: 'Manage Players',
      managePlayersDesc: 'Add or edit player profiles.',
      gameLibrary: 'Game Library',
      gameLibraryDesc: 'Browse available games.',
      manageSpaces: 'Manage Spaces',
      manageSpacesDesc: 'Organize by groups or contexts.',
    },
    goTo: 'Go to {{page}}',
    loadingUserData: 'Loading user data...',
    loginPrompt: 'Please log in to view the dashboard.',
    goToLogin: 'Go to Login',
  },
  addResult: {
    pageTitle: 'Add New Game Result',
    pageDescription: 'Record the outcome of a game and update player scores.',
    loadingForm: 'Loading form...',
    gameLabel: 'Game',
    gamePlaceholder: 'Select a game',
    playersLabel: 'Players',
    playersSelectionPrompt: 'Select {{minPlayers}}{{maxPlayersRange}} players.',
    maxPlayersRange: ' to {{maxPlayers}}',
    orMore: ' or more',
    addPlayerPlaceholder: 'Add a player...',
    allPlayersSelected: 'All available players selected.',
    winnerLabel: 'Winner(s)',
    winnerPlaceholder: 'Select winner(s)...',
    selectedWinner: 'Selected Winner',
    recordMatchButton: 'Record Match',
    validation: {
      gameRequired: 'Please select a game.',
      playerRequired: 'Please select at least one player.',
      winnerRequired: 'Please select at least one winner.',
      minPlayers: 'This game requires at least {{count}} players.',
      maxPlayers: 'This game allows a maximum of {{count}} players.',
      winnerMustBePlayer: 'Winners must be among the selected players.',
      gameNotFound: 'Selected game not found. Please refresh or select another game.',
      moreWinnersThanPlayers: 'Cannot have more winners than players.',
    },
    toasts: {
      gameNotFound: 'The pre-selected game could not be found.',
      authError: 'You must be logged in to record a match.',
      gameNotFoundOnSubmit: 'Selected game not found.',
      maxPlayersReached: 'Max Players Reached',
      maxPlayersReachedDesc: 'This game allows a maximum of {{count}} players.',
      matchRecorded: 'Match Recorded!',
      matchRecordedDesc: '{{gameName}} result has been saved.',
    },
    optional: {
      title: 'Optional Settings',
      pickDate: 'Pick a date and time',
      description: 'Leave blank to use the current date and time.',
      hour: 'Hour',
      minute: 'Minute',
    },
  },
  draw: {
    pageTitle: 'Matchup Generator',
    pageDescription: 'Use the power of AI to generate random pairings for your game or tournament.',
    loading: 'Loading...',
    accessDenied: 'Access Denied',
    accessDeniedDesc: 'Please log in to use the draw generator.',
    aiCommentary: 'AI Commentary',
    defaultCommentary: 'Here are your matchups!',
    roundPairings: "This Round's Pairings",
    byeRound: 'Bye Round',
    byeRoundDesc: '<strong>{{playerName}}</strong> gets a free pass this round!',
    newDrawButton: 'Start a New Draw',
    gameLabel: 'Game',
    gamePlaceholder: 'Select a game for the draw',
    playersLabel: 'Players for the Draw',
    addPlayerPlaceholder: 'Add a player to the pool...',
    allPlayersAdded: 'All players added.',
    selectedPlayersPool: 'Select players to include in the draw.',
    generateButton: 'Generate Matchups',
    generating: 'Generating Draw...',
    selectWinner: 'Select Winner',
    recordResultsButton: 'Record Results',
    recordingResults: 'Recording...',
    toasts: {
      authError: 'You must be logged in.',
      gameNotFound: 'Selected game not found.',
      notEnoughPlayers: 'Not enough players selected.',
      drawFailed: 'Draw Generation Failed',
      drawSuccess: 'Draw Generated!',
      drawSuccessDesc: 'AI has created the matchups for the round.',
      drawUnexpectedError: 'Received an unexpected response from the AI.',
      resultsRecorded: 'Results Recorded',
      resultsRecordedDesc: '{{count}} matches have been successfully recorded.',
      recordResultsError: 'There was an error recording the match results.',
    },
  },
  games: {
    pageTitle: 'Game Library',
    pageDescription: 'Browse, add, or manage games available for tracking.',
    pageDescriptionAdmin: 'Viewing all games across the platform.',
    addGameButton: 'Add New Game',
    searchPlaceholder: 'Search games...',
    noGamesFound: 'No games found matching your search.',
    noGamesYet: 'No games in the library yet.',
    addFirstGame: 'Add Your First Game',
    confirmDeleteTitle: 'Confirm Deletion',
    confirmDeleteDescription: 'Are you sure you want to delete the game "{{gameName}}?"',
    cannotDeleteGame: 'This game is used in recorded matches and cannot be deleted.',
    actionCannotBeUndone: 'This action cannot be undone.',
    deleteGameButton: 'Delete Game',
    recordMatch: 'Record Match',
    players: '{{minPlayers}}{{maxRange}} Players',
    pointsPerWin: 'Points per win: {{count}}',
    owner: 'Owner: {{username}}',
    addGameForm: {
      title: 'Add New Game',
      description: 'Enter the details for the new game to add it to the library.',
      nameLabel: 'Game Name',
      namePlaceholder: 'E.g., Chess, Mario Kart',
      pointsLabel: 'Points Per Win',
      minPlayersLabel: 'Min Players',
      maxPlayersLabel: 'Max Players (optional)',
      maxPlayersPlaceholder: 'Leave blank or 0 for no limit',
      descriptionLabel: 'Description (optional)',
      descriptionPlaceholder: 'Briefly describe the game',
      validation: {
        nameRequired: 'Game name cannot be empty.',
        nameMaxLength: 'Game name is too long (max 50 chars).',
        pointsNonNegative: 'Points per win must be non-negative.',
        minPlayersMin: 'Minimum players must be at least 1.',
        minPlayersMax: 'Max value for min players is 100.',
        maxPlayersNonNegative: 'Max players cannot be negative.',
        maxPlayersMax: 'Max value for max players is 100.',
        maxPlayersGTE: 'Maximum players must be greater than or equal to minimum players (or 0 for no limit).',
        descriptionMaxLength: 'Description is too long (max 200 chars).',
      }
    },
    editGameForm: {
      title: 'Edit Game: {{gameName}}',
      description: "Modify the details for this game. Click save when you're done.",
    },
     toasts: {
        accessDenied: 'Access Denied',
        loginPrompt: 'Please log in to manage the game library.',
        cannotDelete: 'Cannot Delete',
        gameInUse: 'Game is used in recorded matches.',
        gameDeleted: 'Game Deleted',
        gameAdded: 'Game Added',
        gameAddedDesc: '{{name}} added.',
        gameUpdated: 'Game Updated'
     }
  },
  leaderboards: {
    pageTitle: 'Leaderboards',
    pageDescription: "See who's dominating in {{context}}!",
    contextSpace: 'the "{{spaceName}}" space',
    contextGlobal: 'the global arena',
    noDataTitle: 'No Data Yet!',
    noDataDescription: 'Looks like there are no games, spaces, or recorded matches in the current context.',
    noDataPrompt: 'Create a space, add some games, and record match results to see leaderboards appear here.',
    overallRanking: 'Overall Ranking',
    overallLeaderboard: 'Overall Leaderboard',
    gameLeaderboard: '{{gameName}} Leaderboard',
    gameList: 'Select Leaderboard',
    table: {
      rank: 'Rank',
      player: 'Player',
      totalPoints: 'Total Points',
      gamesPlayed: 'Games Played',
      winsLosses: 'Wins / Losses',
      winRate: 'Win Rate',
      noScores: 'No Scores Yet',
      noScoresDescription: 'No match data available for the {{title}}.',
      noScoresPrompt: 'Record some game results to see the leaderboard populate!',
    }
  },
  matchHistory: {
    pageTitle: 'Match History',
    pageDescription: 'Review outcomes in {{context}}.',
    contextSpace: 'the "{{spaceName}}" space',
    contextGlobal: 'the global context (no space)',
    searchPlaceholder: 'Search by game, player, winner...',
    showFilters: 'Show Filters',
    hideFilters: 'Hide Filters',
    filterByGame: 'Filter by Game',
    allGames: 'All Games',
    filterByPlayer: 'Filter by Player',
    allPlayers: 'All Players',
    clearFilters: 'Clear All Filters & Search',
    noMatchesFound: 'No Matches Found',
    noMatchesDescription: 'No matches found for the current space and filters. Try adjusting your search or filters, or go record a new match!',
    recordMatch: 'Record Match',
    matchCard: {
      winner: 'Winner',
      winners: 'Winners',
      participants: 'Participants:',
      victorious: 'Victorious:',
      pointsAwarded: 'Points Awarded:',
      aiHandicaps: 'AI Handicaps Applied:',
      unknownGame: 'Unknown Game',
      invalidDate: 'Invalid Date',
    },
    editDialog: {
        title: 'Edit Match Result',
        description: 'Modify the winners for the {{gameName}} match.'
    },
    toasts: {
        deleted: 'Match successfully deleted.',
        updated: 'Match successfully updated.',
        deleteConfirmTitle: 'Are you sure?',
        deleteConfirmDescription: 'This will permanently delete the match record. This action cannot be undone.'
    }
  },
  players: {
    pageTitle: 'Manage Players',
    pageDescription: 'View, edit, add, or delete players in your roster.',
    pageDescriptionAdmin: 'Viewing all players across the platform.',
    noPlayers: 'No players found. Start by adding some!',
    owner: 'Owner: {{username}}',
    stats: 'Stats',
    deleteConfirmTitle: 'Delete Player?',
    deleteConfirmDescription: 'Are you sure you want to delete "{{playerName}}"? They will appear as "Unknown Player" in past matches.',
    deleteButton: 'Delete Player',
    addNewPlayer: 'Add New Player',
    deleteAllButton: 'Delete All Players',
    deleteAllConfirmTitle: 'Delete All Players?',
    deleteAllConfirmDescription: 'Are you sure you want to delete ALL players? This action is permanent and will affect all matches and leaderboards.',
    addPlayerForm: {
      title: 'Add New Player',
      description: "Enter the details for the new player. Click add when you're done.",
      nameLabel: 'Player Name',
      namePlaceholder: "E.g., 'Shadow Striker'",
      avatarLabel: 'Upload Avatar (Optional)',
      avatarPlaceholder: 'Select image file',
      validation: {
        nameRequired: 'Player name cannot be empty.',
        nameMaxLength: 'Player name is too long (max 50 characters).',
        fileSize: 'Max image size is 5MB.',
        fileType: 'Only .jpg, .jpeg, .png, and .webp formats are supported.',
      }
    },
    editPlayerForm: {
      title: 'Edit Player',
      description: "Change the details for {{playerName}}. Click save when you're done.",
      uploadLabel: 'Upload New Avatar (Optional)',
    },
    toasts: {
        playerAdded: 'Player Added',
        playerAddedDesc: '{{name}} has been added.',
        playerDeleted: 'Player Deleted',
        playerDeletedDesc: 'Player has been removed.',
        playerUpdated: 'Player Updated',
        allPlayersDeleted: 'All Players Deleted',
        allPlayersDeletedDesc: 'Your player roster has been cleared.',
        noPlayersToDelete: 'There are no players to delete.'
    }
  },
  share: {
    errorTitle: 'Sharing Error',
    errorDescription: "We couldn't find the shared data. The link may be invalid or has been deleted.",
    headerSpace: 'Viewing the "{{spaceName}}" space of {{owner}}',
    headerGlobal: "Viewing {{owner}}'s Global Context",
    headerDescription: 'Showing live data which updates automatically.',
    loadingTitle: 'Loading Shared Data...',
    noLink: 'Share ID is missing.',
    fetchError: 'Failed to fetch shared data.',
    players: 'Players',
    liveLinkTitle: 'Live Share Link',
    liveLinkDescription: 'A permanent link that always shows your latest data. Updates automatically.',
    yourLiveLink: 'Your Live Link',
    getLiveLink: 'Get Live Link',
    refreshButton: 'Refresh Data',
  },
  spaces: {
    pageTitle: 'Manage Your Spaces',
    pageDescription: 'Create, edit, and organize your game tracking into different spaces.',
    createSpace: 'Create New Space',
    joinSpace: 'Join a Space',
    noSpaces: 'No spaces found. Create your first space to get started!',
    noOwnedSpaces: "You haven't created any spaces yet.",
    noJoinedSpaces: "You haven't joined any spaces yet.",
    active: 'Active',
    setActive: 'Set Active',
    ownedByYou: 'Owned by you',
    ownedBy: 'Owned by {{ownerName}}',
    members: 'Members',
    leaveSpace: 'Leave Space',
    footerActive: 'Current active space: "{{spaceName}}"',
    footerInactive: 'No space is currently active (showing global data).',
    addForm: {
      title: 'Create New Space',
      description: "Enter a name for your new space. This helps organize your games and leaderboards.",
      nameLabel: 'Space Name',
      namePlaceholder: "E.g., 'Weekend Warriors' or 'Family Game Night'",
      validation: {
        nameRequired: 'Space name cannot be empty.',
        nameMaxLength: 'Space name is too long (max 50 characters).',
      }
    },
    editForm: {
      title: 'Edit Space Name',
      description: 'Change the name for "{{spaceName}}". Click save when you\'re done.',
      nameLabel: 'New Space Name',
    },
    deleteDialog: {
      title: 'Are you sure?',
      description: 'This will delete the space "{{spaceName}}" and all matches and tournaments associated with it. This action cannot be undone.',
      deleteButton: 'Delete Space',
    },
    leaveDialog: {
      title: 'Leave Space?',
      description: 'Are you sure you want to leave the space "{{spaceName}}"? You will need a new invite to join again.',
      confirmButton: 'Leave',
      leaveSuccess: 'You have successfully left the space.'
    },
    joinDialog: {
      title: 'Join a Space',
      description: 'Enter an invite code given to you by a space owner.',
      codeLabel: 'Invite Code',
      codePlaceholder: 'Enter code here',
      joinSuccess: 'You have successfully joined the space!',
      validation: {
        codeRequired: 'Invite code is required.',
        codeInvalid: 'Invite code is invalid or has expired.',
        alreadyOwner: 'You cannot join a space you already own.',
      }
    },
    membersDialog: {
        title: 'Manage Members for {{spaceName}}',
        description: 'Invite others to join using the invite code, or manage current members.',
        inviteCodeLabel: 'Invite Code',
        noCode: 'No code. Regenerate one.',
        listTitle: 'Current Members',
        roles: {
            owner: 'Owner',
            editor: 'Editor',
            viewer: 'Viewer',
        },
        removeConfirmTitle: 'Remove Member?',
        removeConfirmDesc: 'Are you sure you want to remove {{memberName}} from the space "{{spaceName}}"?',
    },
    toasts: {
        spaceCreated: 'Space Created',
        spaceCreatedDesc: 'Space "{{name}}" created.',
        spaceUpdated: 'Space Updated',
        spaceDeleted: 'Space Deleted',
        clearHistoryConfirmTitle: 'Confirm History Clear',
        clearHistoryConfirmDescription: 'Are you sure you want to delete all match records and tournaments in the "{{spaceName}}" space? This action cannot be undone.',
        noMatchesToClear: 'No matches or tournaments to clear.',
        historyCleared: 'Space history and tournaments cleared successfully.',
        codeGenerated: 'New invite code generated.',
        roleUpdated: 'Role Updated',
        memberRemoved: 'Member Removed',
        roleUpdateFailed: 'Failed to update role.',
        removeFailed: 'Failed to remove member.',
    }
  },
  stats: {
    overviewTitle: 'Player Statistics',
    overviewDescription: 'Select a player to view their detailed performance metrics.',
    noPlayers: 'No players have been added yet.',
    managePlayers: 'Manage Players',
    viewFullStats: 'View Full Stats',
    playerPage: {
      loading: 'Loading Player Stats...',
      notFound: 'Player Not Found',
      notFoundDesc: 'The player you are looking for does not exist.',
      backButton: 'Back to Stats Overview',
      overview: 'Player Statistics Overview',
      totalPoints: 'Total Points',
      totalGames: 'Total Games Played',
      winRate: 'Win Rate',
      avgPoints: 'Avg. Points / Match',
      totalWins: 'Total Wins',
      totalLosses: 'Total Losses',
      longestWinStreak: 'Longest Win Streak',
      longestLossStreak: 'Longest Loss Streak',
      currentStreak: 'Current Streak',
      noGamesPlayed: 'No Games Played',
      performanceByGame: 'Performance by Game',
      performanceDesc: 'Wins and losses across different games.',
      wins: 'Wins',
      losses: 'Losses',
    }
  },
  tournaments: {
    pageTitle: 'Tournaments',
    pageDescription: 'Create and manage tournaments to crown a champion.',
    createButton: 'Create New Tournament',
    activeTab: 'Active ({{count}})',
    completedTab: 'Completed ({{count}})',
    noActive: 'No active tournaments. Create one to get started!',
    noCompleted: 'No tournaments have been completed yet.',
    card: {
      statusActive: 'Active',
      statusCompleted: 'Completed',
      game: 'For the game: {{gameName}}',
      targetScore: 'Target Score:',
      points: '{{count}} Points',
      winner: 'Winner:',
      completedOn: 'Completed on {{date}}',
    },
    details: {
      title: 'Tournament Details',
      progressTitle: "Leader's Progress",
      leader: 'Leader',
      noProgress: 'No progress yet',
      standings: 'Tournament Standings',
      winnerTitle: 'Tournament Champion',
      notFound: 'Tournament Not Found',
      notFoundDesc: "The tournament you are looking for doesn't exist.",
      backButton: 'Back to Tournaments',
      completedOn: 'Completed on {{date}}'
    },
    addForm: {
      title: 'Create New Tournament',
      description: 'The first player to reach the target score in the selected game wins.',
      nameLabel: 'Tournament Name',
      namePlaceholder: 'E.g., Season 1 Championship',
      gameLabel: 'Game',
      gamePlaceholder: 'Select a game',
      targetPointsLabel: 'Target Points to Win',
      validation: {
        nameRequired: 'Tournament name is required.',
        nameMaxLength: 'Name is too long.',
        gameRequired: 'Please select a game.',
        targetPointsMin: 'Target points must be at least 1.',
      }
    },
    editForm: {
      title: 'Edit Tournament',
      description: 'Update the details for the "{{tournamentName}}" tournament.',
      gameChangeWarning: 'Game cannot be changed after creation.',
    },
    deleteDialog: {
      title: 'Confirm Deletion',
      description: 'Are you sure you want to delete the tournament "{{tournamentName}}"? This action cannot be undone.',
    },
    toasts: {
        tournamentCreated: 'Tournament Created!',
        tournamentCreatedDesc: 'The "{{name}}" tournament is now active.',
        tournamentUpdated: 'Tournament Updated',
        tournamentDeleted: 'Tournament Deleted',
        tournamentFinished: 'Tournament Finished!',
        tournamentWinner: '{{winnerName}} won the "{{tournamentName}}" tournament!'
    }
  },
  trophyRoom: {
    pageTitle: 'Trophy Room',
    pageDescription: 'A hall of fame for all tournament champions.',
    noChampions: 'No champions have been crowned yet.',
    noChampionsDescription: 'Complete a tournament to see the winners here.',
    trophiesWon: '{{count}} Trophies Won',
    victories: 'Victories:',
    game: 'Game: {{gameName}}',
    date: 'Date: {{date}}',
  },
  users: {
    pageTitle: 'Manage User Accounts',
    pageDescription: "View and manage all user accounts on the platform. Deleting a user is permanent and removes all their associated data.",
    noUsers: 'No other users found.',
    deleteConfirmTitle: 'Confirm User Deletion',
    deleteConfirmDescription: 'Are you sure you want to permanently delete the user "{{username}}"? This action will remove the user\'s profile and ALL their associated data (players, games, matches, etc.). This cannot be undone.',
    deleteButton: 'Yes, Delete User',
    toasts: {
        permissionDenied: 'Permission Denied',
        permissionDeniedDesc: 'You do not have permission to delete users.',
        cannotDeleteSelf: 'Action Not Allowed',
        cannotDeleteSelfDesc: 'You cannot delete your own account.',
        userDeleted: 'User Account Deleted',
        userDeletedDesc: "The user's account and all associated data have been deleted from the database.",
        deleteError: 'Failed to delete user account. See console for details.',
    }
  },
  ai: {
    suggestHandicapPrompt: `You are an expert game handicapper. Given the following player statistics for the game "{{{gameName}}}", suggest a point handicapping system for each player to make the game more fair and exciting. Only suggest a handicap if a player's abilities are noticeably skewed relative to the other players.

Player Statistics:
{{#each playerStats}}
- Player Name: {{{playerName}}}, Win Rate: {{{winRate}}}, Average Score: {{{averageScore}}}
{{/each}}

Output your suggestions as a JSON array. For each player, include the 'playerName' and a 'handicap' field representing the suggested handicap (positive or negative). Also include a short 'reason' for the suggestion. If no handicap is necessary for a player, do not include the 'handicap' or 'reason' fields for that player.

Ensure that the output is valid JSON.
`,
    suggestMatchupsPrompt: `You are an enthusiastic tournament organizer for the game "{{{gameName}}}". Your task is to create a random draw for the players provided.

Players:
{{#each playerNames}}
- {{{this}}}
{{/each}}

Instructions:
1. Shuffle the list of players randomly.
2. Create pairs of players for the matchups.
3. If there is an odd number of players, one player must receive a "bye" and will not be paired for this round. The 'bye' field in the output should contain their name. If the number of players is even, the 'bye' field should be null.
4. Provide some fun, brief commentary about the draw, as if you were announcing it to the players.

Return the result as a valid JSON object matching the provided schema.
`,
  },
};

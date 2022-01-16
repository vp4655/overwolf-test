import axios from "axios";

export const kGamesFeatures = new Map<number, string[]>([
  // Fortnite
  [
    21216,
    [
      'kill',
      'death',
      'match',
      'match_info',
      'rank',
      'me',
      'items'
    ]
  ],
  // CSGO
  [
    7764,
    [
      'match_info',
      'kill',
      'death',
      'assist',
      'headshot',
      'round_start',
      'match_start',
      'match_info',
      'match_end',
      'team_round_win',
      'bomb_planted',
      'bomb_change',
      'reloading',
      'fired',
      'weapon_change',
      'weapon_acquired',
      'info',
      'roster',
      'player_activity_change',
      'team_set',
      'replay',
      'counters',
      'mvp',
      'scoreboard',
      'kill_feed'
    ]
  ],
  // Warframe
  [
    8954,
    [
      'game_info',
      'match_info'
    ]
  ],
]);

export const kGameClassIds = Array.from(kGamesFeatures.keys());

export const kWindowNames = {
  inGame: 'in_game',
  desktop: 'desktop'
};

export const kHotkeys = {
  toggle: 'sample_app_ts_showhide'
};

export let API = axios.create({
  baseURL: 'http://localhost:3000'
})

export const setAuthToken = token => {
  if (token) {
  //applying token
  API.defaults.headers.common['Authorization'] = token;
  } else {
  //deleting the token from header
  delete API.defaults.headers.common['Authorization'];
  }
 }

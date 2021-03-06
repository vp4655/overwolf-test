import {
  OWGames,
  OWGamesEvents,
  OWHotkeys,
  OWGameListener
} from "@overwolf/overwolf-api-ts";

import { AppWindow } from "../AppWindow";
import { kHotkeys, kWindowNames, kGamesFeatures, API } from "../consts";

import WindowState = overwolf.windows.WindowStateEx;

// The window displayed in-game while a game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class InGame extends AppWindow {
  private static _instance: InGame;
  private _gameEventsListener: OWGamesEvents;
  private _gameListener: OWGameListener;
  private _eventsLog: HTMLElement;
  private _infoLog: HTMLElement;
  private matchId: any;
  private gameId: string;
  private matchMode: string;

  private constructor() {
    super(kWindowNames.inGame);

    this._eventsLog = document.getElementById('eventsLog');
    this._infoLog = document.getElementById('infoLog');

    this.setToggleHotkeyBehavior();
    this.setToggleHotkeyText();

    
    this.matchId = null;
    this.gameId = "21";
    this.matchMode = null;
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new InGame();
    }

    return this._instance;
  }

  public async run() {
    const gameClassId = await this.getCurrentGameClassId();

    const gameFeatures = kGamesFeatures.get(gameClassId);

    if (gameFeatures && gameFeatures.length) {
      this._gameEventsListener = new OWGamesEvents(
        {
          onInfoUpdates: this.onInfoUpdates.bind(this),
          onNewEvents: this.onNewEvents.bind(this)
        },
        gameFeatures
      );

      this._gameListener = new OWGameListener({
        onGameStarted: this.onGameStarted.bind(this)
      });

      this._gameEventsListener.start();
      this._gameListener.start();
    }
  }

  private onGameStarted(gameStartedInfo) {
    console.log("ON GAME STARTED INFO:", gameStartedInfo, gameStartedInfo.classId);
    this.gameId = gameStartedInfo.classId.toString();
  }

  private onInfoUpdates(info) {
    if ("match_info" in info) {
      this.storeMatchId(info.match_info);
      this.storeMatchMode(info.match_info);
    }
    this.logLine(this._infoLog, info, false);
    this.postGameEvent(info, 'info event');
  }

  // Special events will be highlighted in the event log
  private onNewEvents(e) {
    const shouldHighlight = e.events.some(event => {
      switch (event.name) {
        case 'kill':
        case 'death':
        case 'assist':
        case 'level':
        case 'matchStart':
        case 'match_start':
        case 'matchEnd':
        case 'match_end':
          return true;
      }

      return false
    });
    this.logLine(this._eventsLog, e, shouldHighlight);
    this.postGameEvent(e, 'game event');
  }

  private async postGameEvent(event: any, type: string) {
    if (this.gameId && this.matchMode && this.matchId) {
      API.post(
          'http://localhost:3000/api/v1/game-events',
          this.generateProductionData(event),
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem('jwt_token')
          }
      }).then((response: any) => {
          console.log('Event of type ' + type);
          console.log(response.data)
      }).catch((error: any) => {
          console.log(error)
      })
    }
  }

  private generateProductionData (event) {
    const timestamp = new Date();
    return {
      event_data: event,
      time_of_event: timestamp.toISOString(),
      game_id: this.gameId,
      game_mode: this.matchMode,
      match_id: this.matchId
    }
  }

  private storeMatchId (event) {
    console.log('checking match id', event);
    if ("matchID" in event) {
      console.log('storing match id', event.matchID);
      this.matchId = event.matchID;
    }
  }

  private storeMatchMode (event) {
    console.log('checking match mode', event);
    if ("mode" in event) {
      console.log('storing match mode', event.mode);
      this.matchMode = event.mode;
    }
  }

  // Displays the toggle minimize/restore hotkey in the window header
  private async setToggleHotkeyText() {
    const gameClassId = await this.getCurrentGameClassId();
    const hotkeyText = await OWHotkeys.getHotkeyText(kHotkeys.toggle, gameClassId);
    const hotkeyElem = document.getElementById('hotkey');
    hotkeyElem.textContent = hotkeyText;
  }

  // Sets toggleInGameWindow as the behavior for the Ctrl+F hotkey
  private async setToggleHotkeyBehavior() {
    const toggleInGameWindow = async (
      hotkeyResult: overwolf.settings.hotkeys.OnPressedEvent
    ): Promise<void> => {
      console.log(`pressed hotkey for ${hotkeyResult.name}`);
      const inGameState = await this.getWindowState();

      if (inGameState.window_state === WindowState.NORMAL ||
        inGameState.window_state === WindowState.MAXIMIZED) {
        this.currWindow.minimize();
      } else if (inGameState.window_state === WindowState.MINIMIZED ||
        inGameState.window_state === WindowState.CLOSED) {
        this.currWindow.restore();
      }
    }

    OWHotkeys.onHotkeyDown(kHotkeys.toggle, toggleInGameWindow);
  }

  // Appends a new line to the specified log
  private logLine(log: HTMLElement, data, highlight) {
    const line = document.createElement('pre');
    line.textContent = JSON.stringify(data);

    if (highlight) {
      line.className = 'highlight';
    }

    // Check if scroll is near bottom
    const shouldAutoScroll =
      log.scrollTop + log.offsetHeight >= log.scrollHeight - 10;

    log.appendChild(line);

    if (shouldAutoScroll) {
      log.scrollTop = log.scrollHeight;
    }
  }

  private async getCurrentGameClassId(): Promise<number | null> {
    const info = await OWGames.getRunningGameInfo();

    return (info && info.isRunning && info.classId) ? info.classId : null;
  }
}

InGame.instance().run();

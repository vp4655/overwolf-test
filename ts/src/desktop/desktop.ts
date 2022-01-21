import { AppWindow } from "../AppWindow";
import { kWindowNames, API, setAuthToken } from "../consts";
import axios from "axios";

// The desktop window is the window displayed while game is not running.
// In our case, our desktop window has no logic - it only displays static data.
// Therefore, only the generic AppWindow class is called.
import WindowState = overwolf.windows.WindowStateEx;

// The window displayed in-game while a game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class Desktop extends AppWindow {
  private static _instance: Desktop;
  private _email: any;
  private _password: any;
  private _loginBtn: HTMLElement;
  private _loginText: HTMLElement;

  private constructor() {
    super(kWindowNames.inGame);

    this._email = document.getElementById('email');
    this._password = document.getElementById('password');
    this._loginBtn = document.getElementById('login');
    this._loginText = document.getElementById('loginText');
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new Desktop();
    }

    return this._instance;
  }

  public async run() {
    this._loginBtn.onclick = () => {
        API.post('/api/v1/authentication/log-in', {
            email: this._email.value,
            password: this._password.value
        }).then((response: any) => {
            this._loginText.innerHTML = "Welcome, " + response.data.name + '!';
            localStorage.setItem('jwt_token', response.data.tokens.access_token);
            setAuthToken(response.data.tokens.access_token);
        }).catch((error) => {
            this._loginText.innerHTML = "Unsuccessful login attempt!";
        })
    }
  }

}

Desktop.instance().run();

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {catchError, of} from "rxjs";
import {EnvironmentService} from "./environment.service";
import {EnvVars} from "../models/envvars";

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  // TODO: Parameterize these somehow with environment (env.tpl?)

  // Cache our currently logged-in user, or undefined if not logged in
  userInfo?: UserInfo;
  envs: EnvVars;

  constructor(private http: HttpClient, private envService: EnvironmentService) {
    this.envs = this.envService.getEnvConfig();
  }

  /** Fetch userInfo from configured URL */
  fetchUserInfo() {
    const url = this.envs.userInfoUrl;
    this.http.get(url, { withCredentials: true }).pipe(catchError(err => {
      // 401 returned, no user found - login required
      this.userInfo = undefined;
      return of(undefined);
    })).subscribe((value: unknown) => {
      // User was found, meaning the cookie was valid
      this.userInfo = value as UserInfo;
    });
  }

  /** Redirect to configured sign in URL */
  login() {
    window.location.href = this.envs.signInUrl;
  }

  /** Redirect to configured sign out URL */
  logout() {
    window.location.href = this.envs.signOutUrl;
  }
}

export interface UserInfo {
  user: string;              // FIXME: this is currently empty
  email: string;             // user's email address in Keycloak
  preferredUsername: string; // username actually lives here
  groups: Array<string>;     // groups + roles from keycloak
}

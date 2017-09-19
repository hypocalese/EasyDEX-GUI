import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import { AddCoin } from './addcoin';
import { toaster } from './toaster';
import { Main } from './main';
import { Dashboard } from './dashboard';
import { ActiveCoin } from './activeCoin';
import { Atomic } from './atomic';
import { Settings } from './settings';
import { Interval } from './interval';
import { SyncOnly } from './syncOnly';
import { Login } from "./login";

const appReducer = combineReducers({
  AddCoin,
  toaster,
  Login,
  Main,
  Dashboard,
  ActiveCoin,
  Atomic,
  Settings,
  Interval,
  SyncOnly,
  routing: routerReducer,
});

// reset app state on logout
const initialState = appReducer({}, {});
const rootReducer = (state, action) => {
  if (action.type === 'LOGOUT') {
    state = initialState;
  }

  return appReducer(state, action);
}

export default rootReducer;

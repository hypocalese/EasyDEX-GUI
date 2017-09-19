import React from 'react';
import { connect } from 'react-redux';
import { translate } from '../../../translate/translate';
import Config from '../../../config';
import { secondsToString } from '../../../util/time';
import {
  getDebugLog,
} from '../../../actions/actionCreators';
import Store from '../../../store';

class DebugLogPanel extends React.Component {
  constructor() {
    super();
    this.state = {
      appRuntimeLog: [],
      debugLinesCount: 10,
      debugTarget: 'iguana',
      nativeOnly: Config.iguanaLessMode,
      toggleAppRuntimeLog: false,
    };
    this.readDebugLog = this.readDebugLog.bind(this);
    this.updateInput = this.updateInput.bind(this);
    this.getAppRuntimeLog = this.getAppRuntimeLog.bind(this);
    this.toggleAppRuntimeLog = this.toggleAppRuntimeLog.bind(this);
    this.renderAppRuntimeLog = this.renderAppRuntimeLog.bind(this);
  }

  readDebugLog() {
    Store.dispatch(
      getDebugLog(
        this.state.debugTarget,
        this.state.debugLinesCount
      )
    );
  }

  renderAppRuntimeLog() {
    let _items = [];
    const _appRuntimeLog = this.state.appRuntimeLog;

    for (let i = 0; i < _appRuntimeLog.length; i++) {
      _items.push(
        <p key={ `app-runtime-log-entry-${i}` }>
          <span>{ secondsToString(_appRuntimeLog[i].time, true) }</span>
          <span className="padding-left-30">{ JSON.stringify(_appRuntimeLog[i].msg, null, '') }</span>
        </p>
      );
    }

    return _items;
  }

  toggleAppRuntimeLog() {
    this.setState(Object.assign({}, this.state, {
      toggleAppRuntimeLog: !this.state.toggleAppRuntimeLog,
    }));

    this.getAppRuntimeLog();
  }

  getAppRuntimeLog() {
    let _appRuntimeLog;

    try {
      _appRuntimeLog = window.require('electron').remote.getCurrentWindow().getAppRuntimeLog;
    } catch (e) {}

    _appRuntimeLog()
    .then((json) => {
      this.setState(Object.assign({}, this.state, {
        appRuntimeLog: json,
      }));
    });
  }

  renderDebugLogData() {
    if (this.props.Settings.debugLog) {
      const _debugLogDataRows = this.props.Settings.debugLog.split('\n');

      if (_debugLogDataRows &&
          _debugLogDataRows.length) {
        return _debugLogDataRows.map((_row) =>
          <div
            key={ `settings-debuglog-${Math.random(0, 9) * 10}` }
            className="padding-bottom-5">{ _row }</div>
        );
      } else {
        return (
          <span>{ translate('INDEX.EMPTY_DEBUG_LOG') }</span>
        );
      }
    } else {
      return null;
    }
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  render() {
    return (
      <div className="row">
        <div className="col-sm-12">
          <p>{ translate('INDEX.DEBUG_LOG_DESC') }</p>
          <div className="margin-top-30">
            <span className="pointer toggle">
              <label className="switch">
                <input
                  type="checkbox"
                  name="settings-app-debug-toggle"
                  value={ this.state.toggleAppRuntimeLog }
                  checked={ this.state.toggleAppRuntimeLog } />
                <div
                  className="slider"
                  onClick={ this.toggleAppRuntimeLog }></div>
              </label>
              <span
                className="title"
                onClick={ this.toggleAppRuntimeLog }>Show app runtime log</span>
            </span>
          </div>
          { !this.state.toggleAppRuntimeLog &&
            <form
              className="read-debug-log-import-form"
              method="post"
              action="javascript:"
              autoComplete="off">
              <div className="form-group form-material floating">
                <input
                  type="text"
                  className="form-control"
                  name="debugLinesCount"
                  id="readDebugLogLines"
                  value={ this.state.debugLinesCount }
                  onChange={ this.updateInput } />
                <label
                  className="floating-label"
                  htmlFor="readDebugLogLines">{ translate('INDEX.DEBUG_LOG_LINES') }</label>
              </div>
              <div className="form-group form-material floating">
                <select
                  className="form-control form-material"
                  name="debugTarget"
                  id="settingsDelectDebugLogOptions"
                  onChange={ this.updateInput }>
                  <option value="iguana" className={ this.state.nativeOnly ? 'hide' : '' }>Iguana</option>
                  <option value="komodo">Komodo</option>
                </select>
                <label
                  className="floating-label"
                  htmlFor="settingsDelectDebugLogOptions">{ translate('INDEX.TARGET') }</label>
              </div>
              <div className="col-sm-12 col-xs-12 text-align-center">
                <button
                  type="button"
                  className="btn btn-primary waves-effect waves-light"
                  onClick={ this.readDebugLog }>{ translate('INDEX.LOAD_DEBUG_LOG') }</button>
              </div>
              <div className="row">
                <div className="col-sm-12 col-xs-12 text-align-left">
                  <div className="padding-top-40 padding-bottom-20 horizontal-padding-0">{ this.renderDebugLogData() }</div>
                </div>
              </div>
            </form>
          }
          { this.state.toggleAppRuntimeLog &&
            <div className="margin-top-20">{ this.renderAppRuntimeLog() }</div>
          }
        </div>
      </div>
    );
  };
}

const mapStateToProps = (state) => {
  return {
    Settings: state.Settings,
  };
};

export default connect(mapStateToProps)(DebugLogPanel);

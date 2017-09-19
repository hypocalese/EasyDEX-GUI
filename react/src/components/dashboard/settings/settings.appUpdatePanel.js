import React from 'react';
import { translate } from '../../../translate/translate';
import { connect } from 'react-redux';
import Config from '../../../config';
import {
  getPeersList,
  checkForUpdateUIPromise,
  updateUIPromise,
} from '../../../actions/actionCreators';

import { SocketProvider } from 'socket.io-react';
import io from 'socket.io-client';

const socket = io.connect(`http://127.0.0.1:${Config.agamaPort}`);

let updateProgressBar = {
  patch: -1,
};

class AppUpdatePanel extends React.Component {
  constructor() {
    super();
    this.state = {
      updatePatch: null,
      updateLog: [],
      updateProgressPatch: null,
      updatePatch: null,
      updateBins: null,
    };
    this._checkForUpdateUIPromise = this._checkForUpdateUIPromise.bind(this);
    this._updateUIPromise = this._updateUIPromise.bind(this);
    this.checkNodes = this.checkNodes.bind(this);
  }

  componentWillMount() {
    socket.on('patch', msg => this.updateSocketsData = (msg) => {});
  }

  componentWillUnmount() {
    socket.removeAllListeners('patch', msg => this.updateSocketsData(msg));
  }

  checkNodes() {
    if (this.state.getPeersCoin) {
      Store.dispatch(getPeersList(this.state.getPeersCoin.split('|')[0]));
    }
  }

  _updateUIPromise() {
    updateProgressBar.patch = 0;
    let _updateLog = [];
    _updateLog.push(`${translate('INDEX.DOWNLOADING_UI_UPDATE')}...`);
    this.setState(Object.assign({}, this.state, {
      updateLog: _updateLog,
    }));

    updateUIPromise();
  }

  _checkForUpdateUIPromise() {
    let _updateLog = [];
    _updateLog.push(translate('INDEX.CHECKING_UI_UPDATE'));
    this.setState(Object.assign({}, this.state, {
      updateLog: _updateLog,
    }));

    checkForUpdateUIPromise()
    .then((res) => {
      let _updateLog = this.state.updateLog;
      _updateLog.push(res.result === 'update' ? (`${translate('INDEX.NEW_UI_UPDATE')} ${res.version.remote}`) : translate('INDEX.YOU_HAVE_LATEST_UI'));
      this.setState(Object.assign({}, this.state, {
        updatePatch: res.result === 'update' ? true : false,
        updateLog: _updateLog,
      }));
    });
  }

  renderUpdateStatus() {
    let items = [];
    let patchProgressBar = null;
    const _updateLogLength = this.state.updateLog.length;

    for (let i = 0; i < _updateLogLength; i++) {
      items.push(
        <div key={ `settings-update-log-${i}` }>{ this.state.updateLog[i] }</div>
      );
    }

    if (_updateLogLength) {
      return (
        <div style={{ minHeight: '200px' }}>
          <hr />
          <h5>{ translate('SETTINGS.PROGRESS') }:</h5>
          <div className="padding-bottom-15">{ items }</div>
          <div className={ updateProgressBar.patch > -1 ? 'progress progress-sm' : 'hide' }>
            <div
              className="progress-bar progress-bar-striped active progress-bar-indicating progress-bar-success font-size-80-percent"
              style={{ width: `${updateProgressBar.patch}%` }}>
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className="row">
        <div className="col-sm-4 padding-top-15">
          <h5>{ translate('INDEX.UI_UPDATE') }</h5>
          <div className="padding-top-15">
            <button
              type="button"
              className="btn btn-info waves-effect waves-light"
              onClick={ this._checkForUpdateUIPromise }>{ translate('INDEX.CHECK_FOR_UPDATE') }</button>
            <button
              type="button"
              className="btn btn-primary waves-effect waves-light margin-left-20"
              onClick={ this._updateUIPromise }
              disabled={ !this.state.updatePatch }>{ translate('INDEX.UPDATE_UI_NOW') }</button>
          </div>
        </div>
        <div className="col-sm-4 padding-top-15 hide">
          <h5>{ translate('INDEX.BINS_UPDATE') }</h5>
          <div className="padding-top-15">
            <button
              type="button"
              className="btn btn-info waves-effect waves-light"
              onClick={ this._checkForUpdateUIPromise }>{ translate('INDEX.CHECK_FOR_UPDATE') }</button>
            <button
              type="button"
              className="btn btn-primary waves-effect waves-light margin-left-20"
              onClick={ this.checkNodes }>{ translate('INDEX.UPDATE_BINS_NOW') }</button>
          </div>
        </div>
        <div className="col-sm-12 padding-top-15">
          { this.renderUpdateStatus() }
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

export default connect(mapStateToProps)(AppUpdatePanel);

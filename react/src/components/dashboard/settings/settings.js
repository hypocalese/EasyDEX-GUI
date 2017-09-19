import React from 'react';
import { connect } from 'react-redux';
import { translate } from '../../../translate/translate';
import {
  iguanaActiveHandle,
  getAppConfig,
  getAppInfo,
} from '../../../actions/actionCreators';
import Store from '../../../store';

import {
  SettingsRender,
} from './settings.render';

/*
  TODO:
  1) pre-select active coin in add node tab
  2) add fiat section
  3) kickstart section
  4) batch export/import wallet addresses
*/
class Settings extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount(props) {
    if (!this.props.disableWalletSpecificUI) {
      Store.dispatch(iguanaActiveHandle());
    }
    Store.dispatch(getAppConfig());
    Store.dispatch(getAppInfo());

    document.getElementById('section-iguana-wallet-settings').setAttribute('style', 'height:auto; min-height: 100%');
  }

  render() {
    return SettingsRender.call(this);
  }
}

const mapStateToProps = (state) => {
  return {
    Main: {
      coins: state.Main.coins,
    },
  };
};

export default connect(mapStateToProps)(Settings);

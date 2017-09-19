import React from 'react';
import { connect } from 'react-redux';
import {
  toggleAddcoinModal,
  iguanaWalletPassphrase,
  iguanaActiveHandle,
  startInterval,
  getDexCoins,
  toggleSyncOnlyModal,
  getSyncOnlyForks,
  createNewWallet,
  triggerToaster,
  toggleLoginSettingsModal
} from '../../actions/actionCreators';
import Config from '../../config';
import Store from '../../store';
import { PassPhraseGenerator } from '../../util/crypto/passphrasegenerator';
import SwallModalRender from './swall-modal.render';
import LoginRender from './login.render';
import { translate } from '../../translate/translate';
import {
  encryptPassphrase,
  loadPinList,
  loginWithPin
} from '../../actions/actions/pin';

const IGUNA_ACTIVE_HANDLE_TIMEOUT = 3000;
const IGUNA_ACTIVE_COINS_TIMEOUT = 10000;

// TODO: remove duplicate activehandle and activecoins calls

class Login extends React.Component {
  constructor() {
    super();
    this.state = {
      display: false,
      activeLoginSection: 'activateCoin',
      loginPassphrase: '',
      seedInputVisibility: false,
      loginPassPhraseSeedType: null,
      bitsOption: 256,
      randomSeed: PassPhraseGenerator.generatePassPhrase(256),
      randomSeedConfirm: '',
      isSeedConfirmError: false,
      isSeedBlank: false,
      displaySeedBackupModal: false,
      customWalletSeed: false,
      isCustomSeedWeak: false,
      nativeOnly: Config.iguanaLessMode,
      trimPassphraseTimer: null,
      displayLoginSettingsDropdown: false,
      displayLoginSettingsDropdownSection: null,
      shouldEncryptSeed: false,
      encryptKey: '',
      pubKey: '',
      decryptKey: '',
      selectedPin: '',
      isExperimentalOn: false,
    };
    this.toggleActivateCoinForm = this.toggleActivateCoinForm.bind(this);
    this.updateRegisterConfirmPassPhraseInput = this.updateRegisterConfirmPassPhraseInput.bind(this);
    this.updateLoginPassPhraseInput = this.updateLoginPassPhraseInput.bind(this);
    this.loginSeed = this.loginSeed.bind(this);
    this.toggleSeedInputVisibility = this.toggleSeedInputVisibility.bind(this);
    this.handleRegisterWallet = this.handleRegisterWallet.bind(this);
    this.openSyncOnlyModal = this.openSyncOnlyModal.bind(this);
    this.toggleSeedBackupModal = this.toggleSeedBackupModal.bind(this);
    this.copyPassPhraseToClipboard = this.copyPassPhraseToClipboard.bind(this);
    this.execWalletCreate = this.execWalletCreate.bind(this);
    this.resizeLoginTextarea = this.resizeLoginTextarea.bind(this);
    this.toggleLoginSettingsDropdown = this.toggleLoginSettingsDropdown.bind(this);
    this.updateEncryptKey = this.updateEncryptKey.bind(this);
    this.updatePubKey = this.updatePubKey.bind(this);
    this.updateDecryptKey = this.updateDecryptKey.bind(this);
    this.loadPinList = this.loadPinList.bind(this);
  }

  // the setInterval handler for 'activeCoins'
  _iguanaActiveCoins = null;

  toggleLoginSettingsDropdownSection(sectionName) {
    Store.dispatch(toggleLoginSettingsModal(true));

    this.setState({
      displayLoginSettingsDropdown: false,
      displayLoginSettingsDropdownSection: sectionName,
    });
  }

  isCustomWalletSeed() {
    return this.state.customWalletSeed;
  }

  toggleCustomWalletSeed() {
    this.setState({
      customWalletSeed: !this.state.customWalletSeed
    }, () => {
      // if customWalletSeed is set to false, regenerate the seed
      if (!this.state.customWalletSeed) {
        this.setState({
          randomSeed: PassPhraseGenerator.generatePassPhrase(this.state.bitsOption),
          isSeedConfirmError: false,
          isSeedBlank: false,
        });
      } else {
        // if customWalletSeed is set to true, reset to seed to an empty string
        this.setState({
          randomSeed: '',
          randomSeedConfirm: '',
        });
      }
    });
  }

  shouldEncryptSeed() {
    return this.state.shouldEncryptSeed;
  }

  toggleShouldEncryptSeed() {
    this.setState({
      shouldEncryptSeed: !this.state.shouldEncryptSeed
    });
  }

  updateEncryptKey(e) {
    this.setState({
      encryptKey: e.target.value
    });
  }

  updatePubKey(e) {
    this.setState({
      pubKey: e.target.value
    });
  }


  updateDecryptKey(e) {
    this.setState({
      decryptKey: e.target.value
    });
  }

  openSyncOnlyModal() {
    Store.dispatch(getSyncOnlyForks());

    const _iguanaActiveHandle = setInterval(() => {
      Store.dispatch(getSyncOnlyForks());
    }, IGUNA_ACTIVE_HANDLE_TIMEOUT);
    Store.dispatch(
      startInterval(
        'syncOnly',
        _iguanaActiveHandle
      )
    );

    Store.dispatch(toggleSyncOnlyModal(true));
    this.setState({
      displayLoginSettingsDropdown: false,
    });
  }

  componentDidMount() {
    Store.dispatch(iguanaActiveHandle(true));
    // this.loadPinList();

    let appConfig;

    try {
      appConfig = window.require('electron').remote.getCurrentWindow().appConfig;
    } catch (e) {}

    this.setState({
      isExperimentalOn: appConfig.experimentalFeatures,
    });
  }

  toggleSeedInputVisibility() {
    this.setState({
      seedInputVisibility: !this.state.seedInputVisibility,
    });

    this.resizeLoginTextarea();
  }

  generateNewSeed(bits) {
    this.setState(Object.assign({}, this.state, {
      randomSeed: PassPhraseGenerator.generatePassPhrase(bits),
      bitsOption: bits,
      isSeedBlank: false,
    }));
  }

  toggleLoginSettingsDropdown() {
    this.setState(Object.assign({}, this.state, {
      displayLoginSettingsDropdown: !this.state.displayLoginSettingsDropdown,
    }));
  }

  componentWillReceiveProps(props) {
    if (props.Login.pinList === 'no pins') {
      props.Login.pinList = [];
    }
    if (props &&
        props.Main &&
        props.Main.isLoggedIn) {
      this.setState({
        display: false,
      });
    }

    if (props &&
        props.Main &&
        !props.Main.isLoggedIn) {
      this.setState({
        display: true,
      });

      if (!this.props.Interval.interval.activeCoins) {
        // only start a new 'activeCoins' interval if a previous one doesn't exist
        if (!this._iguanaActiveCoins) {
          this._iguanaActiveCoins = setInterval(() => {
            Store.dispatch(getDexCoins());
          }, IGUNA_ACTIVE_COINS_TIMEOUT);
          Store.dispatch(startInterval('activeCoins', this._iguanaActiveCoins));
        }
      }

      document.body.className = 'page-login layout-full page-dark';
    }

    if (this.state.activeLoginSection !== 'signup') {
      if (props &&
          props.Main &&
          props.Main.activeCoins) {
        this.setState({
          activeLoginSection: 'login',
        });
      } else {
        this.setState({
          activeLoginSection: 'activateCoin',
        });
      }
    }
  }

  toggleActivateCoinForm() {
    Store.dispatch(toggleAddcoinModal(true, false));
  }

  resizeLoginTextarea() {
    // auto-size textarea
    setTimeout(() => {
      if (this.state.seedInputVisibility) {
          document.querySelector('#loginPassphrase').style.height = '1px';
          document.querySelector('#loginPassphrase').style.height = `${(15 + document.querySelector('#loginPassphrase').scrollHeight)}px`;
      }
    }, 100);
  }

  updateLoginPassPhraseInput(e) {
    // remove any empty chars from the start/end of the string
    const newValue = e.target.value;

    clearTimeout(this.state.trimPassphraseTimer);

    const _trimPassphraseTimer = setTimeout(() => {
      this.setState({
        loginPassphrase: newValue ? newValue.trim() : '', // hardcoded field name
        loginPassPhraseSeedType: this.getLoginPassPhraseSeedType(newValue),
      });
    }, 2000);

    this.resizeLoginTextarea();

    this.setState({
      trimPassphraseTimer: _trimPassphraseTimer,
      [e.target.name]: newValue,
      loginPassPhraseSeedType: this.getLoginPassPhraseSeedType(newValue),
    });
  }

  updateRegisterConfirmPassPhraseInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
      isSeedConfirmError: false,
      isSeedBlank: this.isBlank(e.target.value),
    });
  }

  updateWalletSeed(e) {
    this.setState({
      randomSeed: e.target.value,
      isSeedConfirmError: false,
      isSeedBlank: this.isBlank(e.target.value),
    });
  }

  loginSeed() {
    // reset the login pass phrase values so that when the user logs out, the values are clear
    this.setState({
      loginPassphrase: null,
      loginPassPhraseSeedType: null,
    });

    if (this.state.shouldEncryptSeed) {
      Store.dispatch(encryptPassphrase(this.state.loginPassphrase, this.state.encryptKey, this.state.pubKey));
    }

    if (this.state.selectedPin) {
      Store.dispatch(loginWithPin(this.state.decryptKey, this.state.selectedPin));
    } else {
      Store.dispatch(
        iguanaWalletPassphrase(this.state.loginPassphrase)
      );
    }
  }

  loadPinList() {
    Store.dispatch(loadPinList());
  }

  updateSelectedPin(e) {
    this.setState({
      selectedPin: e.target.value
    });
  }

  getLoginPassPhraseSeedType(passPhrase) {
    if (!passPhrase) {
      return null;
    }

    const passPhraseWords = passPhrase.split(' ');
    if (!PassPhraseGenerator.arePassPhraseWordsValid(passPhraseWords)) {
      return null;
    }

    if (PassPhraseGenerator.isPassPhraseValid(passPhraseWords, 256)) {
      return translate('LOGIN.IGUANA_SEED');
    }

    if (PassPhraseGenerator.isPassPhraseValid(passPhraseWords, 160)) {
      return translate('LOGIN.WAVES_SEED');
    }

    if (PassPhraseGenerator.isPassPhraseValid(passPhraseWords, 128)) {
      return translate('LOGIN.NXT_SEED');
    }

    return null;
  }

  updateActiveLoginSection(name) {
    // reset login/create form
    this.setState({
      activeLoginSection: name,
      loginPassphrase: null,
      loginPassPhraseSeedType: null,
      seedInputVisibility: false,
      bitsOption: 256,
      randomSeed: PassPhraseGenerator.generatePassPhrase(256),
      randomSeedConfirm: '',
      isSeedConfirmError: false,
      isSeedBlank: false,
      displaySeedBackupModal: false,
      customWalletSeed: false,
      isCustomSeedWeak: false,
   });
  }

  execWalletCreate() {
    Store.dispatch(
      createNewWallet(
        this.state.randomSeedConfirm,
        this.props.Dashboard.activeHandle
      )
    );

    this.setState({
      activeLoginSection: 'activateCoin',
      displaySeedBackupModal: false,
      isSeedConfirmError: false,
    });
  }

  // TODO: disable register btn if seed or seed conf is incorrect
  handleRegisterWallet() {
    const enteredSeedsMatch = this.state.randomSeed === this.state.randomSeedConfirm;
    const isSeedBlank = this.isBlank(this.state.randomSeed);

    // if custom seed check for string strength
    // at least 1 letter in upper case
    // at least 1 digit
    // at least one special char
    // min length 10 chars

    const _customSeed = this.state.customWalletSeed ? this.state.randomSeed.match('^(?=.*[A-Z])(?=.*[^<>{}\"/|;:.,~!?@#$%^=&*\\]\\\\()\\[_+]*$)(?=.*[0-9])(?=.*[a-z]).{10,99}$') : false;

    this.setState({
      isCustomSeedWeak: _customSeed === null ? true : false,
      isSeedConfirmError: !enteredSeedsMatch ? true : false,
      isSeedBlank: isSeedBlank ? true : false,
    });

    if (enteredSeedsMatch && !isSeedBlank && _customSeed !== null) {
      this.toggleSeedBackupModal();
    }
  }

  isBlank(str) {
    return (!str || /^\s*$/.test(str));
  }

  handleKeydown(e) {
    this.updateLoginPassPhraseInput(e);

    if (e.key === 'Enter') {
      this.loginSeed();
    }
  }

  toggleSeedBackupModal() {
    this.setState(Object.assign({}, this.state, {
      displaySeedBackupModal: !this.state.displaySeedBackupModal,
    }));
  }

  copyPassPhraseToClipboard() {
    const passPhrase = this.state.randomSeed;
    const textField = document.createElement('textarea');

    textField.innerText = passPhrase;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();

    Store.dispatch(
      triggerToaster(
        translate('LOGIN.SEED_SUCCESSFULLY_COPIED'),
        translate('LOGIN.SEED_COPIED'),
        'success'
      )
    );
  }

  renderSwallModal() {
    if (this.state.displaySeedBackupModal) {
      return SwallModalRender.call(this);
    }

    return null;
  }

  render() {
    if ((this.state && this.state.display) ||
        !this.props.Main) {
      return LoginRender.call(this);
    }

    return null;
  }
}

const mapStateToProps = (state) => {
  return {
    Main: state.Main,
    Dashboard: {
      activeHandle: state.Dashboard.activeHandle,
    },
    Interval: {
      interval: state.Interval.interval,
    },
    Login: state.Login,
  };
};

export default connect(mapStateToProps)(Login);

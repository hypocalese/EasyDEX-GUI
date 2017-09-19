import React from 'react';
import { connect } from 'react-redux';
import Config from '../../../config';
import { translate } from '../../../translate/translate';
import { checkTimestamp } from '../../../util/time';
import {
  edexGetTxIDList,
  edexRemoveTXID
} from '../../../util/cacheFormat';
import {
  resolveOpenAliasAddress,
  triggerToaster,
  shepherdGroomPostPromise,
  edexGetTransaction,
  getCacheFile,
  fetchUtxoCache,
  sendToAddress,
  iguanaUTXORawTX,
  clearLastSendToResponseState,
  sendToAddressStateAlt,
  dexSendRawTX
} from '../../../actions/actionCreators';
import Store from '../../../store';
import {
  UTXOCacheInfoRender,
  SendCoinResponseRender,
  OASendUIRender,
  SendApiTypeSelectorRender,
  SendCoinRender
} from './sendCoin.render';

import io from 'socket.io-client';
import { isPositiveNumber } from '../../../util/number';
const socket = io.connect(`http://127.0.0.1:${Config.agamaPort}`);

// TODO: prevent any cache updates rather than utxo while on send coin form
//       fix a bug - total amount is incorrect when switching between steps

class SendCoin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStep: 0,
      sendFrom: this.props.Dashboard.activeHandle ? this.props.Dashboard.activeHandle[this.props.ActiveCoin.coin] : null,
      sendFromAmount: 0,
      sendTo: '',
      sendToOA: null,
      amount: 0,
      fee: 0.0001,
      sendSig: false,
      sendApiType: true,
      addressSelectorOpen: false,
      currentStackLength: 0,
      totalStackLength: 0,
      utxoMethodInProgress: false,
    };
    this.updateInput = this.updateInput.bind(this);
    this.handleBasiliskSend = this.handleBasiliskSend.bind(this);
    this.openDropMenu = this.openDropMenu.bind(this);
    this.toggleSendSig = this.toggleSendSig.bind(this);
    this.getOAdress = this.getOAdress.bind(this);
    this.toggleSendAPIType = this.toggleSendAPIType.bind(this);
    this._fetchNewUTXOData = this._fetchNewUTXOData.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.setRecieverFromScan = this.setRecieverFromScan.bind(this);
    socket.on('messages', msg => this.updateSocketsData(msg));
  }

  setRecieverFromScan(receiver) {
    try {
      const recObj = JSON.parse(receiver);

      if (recObj &&
          typeof recObj === 'object') {
        if (recObj.coin === this.props.ActiveCoin.coin) {
          if (recObj.amount) {
            this.setState({
              amount: recObj.amount,
            });
          }
          if (recObj.address) {
            this.setState({
              sendTo: recObj.address,
            });
          }
        }
      }
    } catch (e) {
      this.setState({
        sendTo: receiver,
      });
    }

    document.getElementById('edexcoinSendTo').focus();
  }

  componentWillMount() {
    document.addEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  handleClickOutside(e) {
    if (e.srcElement.className !== 'btn dropdown-toggle btn-info' &&
        (e.srcElement.offsetParent && e.srcElement.offsetParent.className !== 'btn dropdown-toggle btn-info') &&
        (e.path && e.path[4] && e.path[4].className.indexOf('showkmdwalletaddrs') === -1)) {
      this.setState({
        addressSelectorOpen: false,
      });
    }
  }

  componentWillReceiveProps(props) {
    if (this.state &&
        !this.state.sendFrom &&
        this.props.ActiveCoin.activeAddress) {
      this.setState(Object.assign({}, this.state, {
        sendFrom: this.props.ActiveCoin.activeAddress,
      }));
    }
  }

  updateSocketsData(data) {
    if (data &&
        data.message &&
        data.message.shepherd.iguanaAPI &&
        data.message.shepherd.iguanaAPI.totalStackLength) {
      this.setState(Object.assign({}, this.state, {
        totalStackLength: data.message.shepherd.iguanaAPI.totalStackLength,
      }));
    }
    if (data &&
        data.message &&
        data.message.shepherd.iguanaAPI &&
        data.message.shepherd.iguanaAPI.currentStackLength) {
      this.setState(Object.assign({}, this.state, {
        currentStackLength: data.message.shepherd.iguanaAPI.currentStackLength,
      }));
    }
  }

  _fetchNewUTXOData() {
    Store.dispatch(fetchUtxoCache({
      pubkey: this.props.Dashboard.activeHandle.pubkey,
      allcoins: false,
      coin: this.props.ActiveCoin.coin,
      calls: 'refresh',
      address: this.state.sendFrom,
    }));
  }

  renderUTXOCacheInfo() {
    if (this.props.ActiveCoin.mode === 'basilisk' &&
        this.state.sendFrom &&
        !this.state.sendApiType &&
        this.props.ActiveCoin.cache &&
        this.props.ActiveCoin.cache[this.props.ActiveCoin.coin][this.state.sendFrom]) {
        let refreshCacheData;
        let timestamp;
        let isReadyToUpdate;
        let waitUntilCallIsFinished = this.state.currentStackLength > 1 ? true : false;
        const _cache = this.props.ActiveCoin.cache;
        const _coin = this.props.ActiveCoin.coin;
        const _sendFrom = this.state.sendFrom;

      if (_cache[_coin][_sendFrom].refresh ||
          _cache[_coin][_sendFrom].listunspent) {
        refreshCacheData = _cache[_coin][_sendFrom].refresh || _cache[_coin][_sendFrom].listunspent;
        timestamp = checkTimestamp(refreshCacheData.timestamp);
        isReadyToUpdate = timestamp > 600 ? true : false;
      } else {
        isReadyToUpdate = true;
      }

      if (_cache[_coin][_sendFrom].refresh &&
          _cache[_coin][_sendFrom].refresh.data &&
          _cache[_coin][_sendFrom].refresh.data.error &&
          _cache[_coin][_sendFrom].refresh.data.error === 'request failed') {
        timestamp = null;
      }

      return UTXOCacheInfoRender.call(
        this,
        refreshCacheData,
        isReadyToUpdate,
        waitUntilCallIsFinished,
        timestamp
      );
    }

    return null;
  }

  renderAddressAmount(address) {
    const _addresses = this.props.ActiveCoin.addresses;

    if (_addresses &&
        _addresses.public &&
        _addresses.public.length) {
      for (let i = 0; i < _addresses.public.length; i++) {
        if (_addresses.public[i].address === address) {
          if (_addresses.public[i].amount !== 'N/A') {
            return _addresses.public[i].amount;
          }
        }
      }
    } else {
      return 0;
    }
  }

  renderAddressByType(type) {
    const _addresses = this.props.ActiveCoin.addresses;

    if (_addresses &&
        _addresses[type] &&
        _addresses[type].length) {
      if (this.state.sendApiType) {
        const mainAddress = this.props.Dashboard.activeHandle[this.props.ActiveCoin.coin];
        const mainAddressAmount = this.renderAddressAmount(mainAddress);

        return(
          <li
            key={ mainAddress }
            className={ mainAddressAmount <= 0 ? 'hide' : '' }>
            <a onClick={ () => this.updateAddressSelection(mainAddress, type, mainAddressAmount) }>
              <i className={ 'icon fa-eye' + (type === 'public' ? '' : '-slash') }></i>&nbsp;&nbsp;
              <span className="text">
                [ { mainAddressAmount } { this.props.ActiveCoin.coin } ]&nbsp;&nbsp;
                { mainAddress }
              </span>
              <span className="glyphicon glyphicon-ok check-mark"></span>
            </a>
          </li>
        );
      } else {
        let items = [];
        const _addresses = this.props.ActiveCoin.addresses;
        const _cache = this.props.ActiveCoin.cache;
        const _coin = this.props.ActiveCoin.coin;

        for (let i = 0; i < _addresses[type].length; i++) {
          const address = _addresses[type][i].address;
          let _amount = address.amount;

          if (this.props.ActiveCoin.mode === 'basilisk' &&
              _cache) {
            _amount = _cache[_coin][address] && _cache[_coin][address].getbalance.data && _cache[_coin][address].getbalance.data.balance ? _cache[_coin][address].getbalance.data.balance : 'N/A';
          }

          if (_amount !== 'N/A') {
            items.push(
              <li
                key={ address }
                className={ _amount <= 0 ? 'hide' : '' }>
                <a onClick={ () => this.updateAddressSelection(address, type, _amount) }>
                  <i className={ 'icon fa-eye' + (type === 'public' ? '' : '-slash') }></i>&nbsp;&nbsp;
                  <span className="text">[ { _amount } { _coin } ]  { address }</span>
                  <span className="glyphicon glyphicon-ok check-mark"></span>
                </a>
              </li>
            );
          }
        }

        return items;
      }
    } else {
      return null;
    }
  }

  renderSelectorCurrentLabel() {
    if (this.state.sendFrom) {
      let _amount;
      const _cache = this.props.ActiveCoin.cache;
      const _coin = this.props.ActiveCoin.coin;
      const _sendFrom = this.state.sendFrom;

      if (this.state.sendFromAmount === 0 &&
          this.props.ActiveCoin.mode === 'basilisk' &&
          _cache) {
        _amount = _cache[_coin][_sendFrom].getbalance.data && _cache[_coin][_sendFrom].getbalance.data.balance ? _cache[_coin][_sendFrom].getbalance.data.balance : 'N/A';
      } else {
        _amount = this.state.sendFromAmount;
      }

      return (
        <span>
          <i className={ 'icon fa-eye' + (this.state.addressType === 'public' ? '' : '-slash') }></i>&nbsp;&nbsp;
          <span className="text">[ { _amount } { _coin } ]  { _sendFrom }</span>
        </span>
      );
    } else if (this.state.sendApiType) {
      const mainAddress = this.props.Dashboard.activeHandle[this.props.ActiveCoin.coin];
      const mainAddressAmount = this.renderAddressAmount(mainAddress);

      return (
        <span>
          <i className={ 'icon fa-eye' + (this.state.addressType === 'public' ? '' : '-slash') }></i>&nbsp;&nbsp;
          <span className="text">[ { mainAddressAmount } { this.props.ActiveCoin.coin } ]  { mainAddress }</span>
        </span>
      );
    } else {
      return (
        <span>{ translate('SEND.SELECT_T_OR_Z_ADDR') }</span>
      );
    }
  }

  renderAddressList() {
    return (
      <div className={ `btn-group bootstrap-select form-control form-material showkmdwalletaddrs show-tick ${(this.state.addressSelectorOpen ? 'open' : '')}` }>
        <button
          type="button"
          className="btn dropdown-toggle btn-info"
          title={ `${translate('SEND.SELECT_T_OR_Z_ADDR')}` }
          onClick={ this.openDropMenu }>
          <span className="filter-option pull-left">
            { this.renderSelectorCurrentLabel() }&nbsp;&nbsp;
          </span>
          <span className="bs-caret">
            <span className="caret"></span>
          </span>
        </button>
        <div className="dropdown-menu open">
          <ul className="dropdown-menu inner">
            <li className="selected">
              <a>
                <span className="text">{ translate('SEND.SELECT_T_OR_Z_ADDR') }</span>
                <span className="glyphicon glyphicon-ok check-mark"></span>
              </a>
            </li>
            { this.renderAddressByType('public') }
          </ul>
        </div>
      </div>
    );
  }

  openDropMenu() {
    this.setState(Object.assign({}, this.state, {
      addressSelectorOpen: !this.state.addressSelectorOpen,
    }));
  }

  updateAddressSelection(address, type, amount) {
    let _sendFromAmount = amount ? amount : this.props.ActiveCoin.addresses[type][address].amount;
    const _cache = this.props.ActiveCoin.cache;
    const _coin = this.props.ActiveCoin.coin;

    if (this.props.ActiveCoin.mode === 'basilisk' &&
        this.props.ActiveCoin.cache) {
      _sendFromAmount = _cache[_coin][address].getbalance.data && _cache[_coin][address].getbalance.data.balance ? _cache[_coin][address].getbalance.data.balance : 'N/A';
    }

    this.setState(Object.assign({}, this.state, {
      sendFrom: address,
      addressType: type,
      sendFromAmount: _sendFromAmount,
      addressSelectorOpen: !this.state.addressSelectorOpen,
    }));
  }

  changeSendCoinStep(step) {
    if (step === 0) {
      Store.dispatch(clearLastSendToResponseState());

      this.setState({
        currentStep: 0,
        sendFrom: this.props.Dashboard && this.props.Dashboard.activeHandle ? this.props.Dashboard.activeHandle[this.props.ActiveCoin.coin] : null,
        sendFromAmount: 0,
        sendTo: '',
        sendToOA: null,
        amount: 0,
        fee: 0.0001,
        sendSig: false,
        sendApiType: true,
        addressSelectorOpen: false,
        currentStackLength: 0,
        totalStackLength: 0,
        utxoMethodInProgress: false,
      });
    }

    if (step === 1) {
      if (!this.validateSendFormData()) {
        return;
      }
    }

    if (step === 1 ||
        step === 2) {
      this.setState(Object.assign({}, this.state, {
        currentStep: step,
        utxoMethodInProgress: !this.state.sendApiType && this.props.ActiveCoin.mode === 'basilisk' ? true : false,
      }));
    }

    if (step === 2) {
      if (!this.state.sendApiType &&
          this.props.ActiveCoin.mode === 'basilisk') {
        this.handleBasiliskSend();
      } else {
        Store.dispatch(
          sendToAddress(
            this.props.ActiveCoin.coin,
            this.state
          )
        );
      }
    }
  }

  toggleSendSig() {
    this.setState(Object.assign({}, this.state, {
      sendSig: !this.state.sendSig,
    }));
  }

  toggleSendAPIType() {
    this.setState(Object.assign({}, this.state, {
      sendApiType: !this.state.sendApiType,
      fee: !this.state.sendApiType ? 0 : 0.0001,
      sendFrom: this.props.Dashboard.activeHandle[this.props.ActiveCoin.coin],
    }));
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  // TODO: move to action creators
  handleBasiliskSend() {
    const refreshData = this.props.ActiveCoin.cache[this.props.ActiveCoin.coin][this.state.sendFrom].refresh;
    const listunspentData = this.props.ActiveCoin.cache[this.props.ActiveCoin.coin][this.state.sendFrom].listunspent;
    const utxoSet = (refreshData && refreshData.data) || (listunspentData && listunspentData.data);
    const _pubkey = this.props.Dashboard.activeHandle.pubkey;
    const forceUpdateCache = this._fetchNewUTXOData;
    const _sendFrom = this.state.sendFrom;
    const sendData = {
      coin: this.props.ActiveCoin.coin,
      sendfrom: this.state.sendFrom,
      sendtoaddr: this.state.sendTo,
      amount: this.state.amount,
      txfee: this.state.fee,
      sendsig: this.state.sendSig === true ? 0 : 1,
      utxos: utxoSet,
    };

    // TODO: es arrows
    iguanaUTXORawTX(sendData, Store.dispatch)
    .then(function(json) {
      if (json.result === 'success' &&
          json.completed === true) {
        Store.dispatch(
          triggerToaster(
            translate('TOASTR.SIGNED_TX_GENERATED'),
            translate('TOASTR.WALLET_NOTIFICATION'),
            'success'
          )
        );

        if (sendData.sendsig === 1) {
          const dexrawtxData = {
            signedtx: json.signedtx,
            coin: sendData.coin,
          };
          dexSendRawTX(
            dexrawtxData,
            Store.dispatch
          ).then(function(dexRawTxJSON) {
            if (dexRawTxJSON.indexOf('"error":{"code"') > -1) {
              Store.dispatch(
                triggerToaster(
                  translate('TOASTR.TRANSACTION_FAILED'),
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'error'
                )
              );
              Store.dispatch(sendToAddressStateAlt(JSON.parse(dexRawTxJSON)));

              this.setState(Object.assign({}, this.state, {
                utxoMethodInProgress: false,
              }));
            } else {
              Store.dispatch(
                triggerToaster(
                  translate('TOASTR.SIGNED_TX_SENT'),
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'success'
                )
              );
              Store.dispatch(sendToAddressStateAlt(json));

              let getTxidData = function() {
                return new Promise(function(resolve, reject) {
                  Store.dispatch(
                    triggerToaster(
                      translate('TOASTR.GETTING_TXID_INFO'),
                      translate('TOASTR.WALLET_NOTIFICATION'),
                      'info'
                    )
                  );

                  edexGetTransaction({
                    coin: sendData.coin,
                    txid: dexRawTxJSON.txid ? dexRawTxJSON.txid : dexRawTxJSON,
                  }, Store.dispatch)
                  .then(function(json) {
                    resolve(json);
                  });
                });
              }

              let processRefreshUTXOs = function(vinData) {
                return new Promise(function(resolve, reject) {
                  let edexGetTxIDListRes = edexGetTxIDList(vinData);
                  resolve(edexGetTxIDListRes);
                });
              }

              let getDataCacheContents = function(txidListToRemove) {
                return new Promise(function(resolve, reject) {
                  getCacheFile(_pubkey)
                  .then(function(result) {
                    let saveThisData = edexRemoveTXID(result.result, _sendFrom, txidListToRemove);
                    resolve(saveThisData);
                  });
                });
              }

              let saveNewCacheData = function(saveThisData) {
                return new Promise(function(resolve, reject) {
                  shepherdGroomPostPromise(
                    _pubkey,
                    saveThisData
                  ).then(function(result) {
                    resolve(result);
                    forceUpdateCache();
                    Store.dispatch(
                      triggerToaster(
                        translate('TOASTR.LOCAL_UTXO_UPDATED'),
                        translate('TOASTR.WALLET_NOTIFICATION'),
                        'info'
                      )
                    );

                    this.setState(Object.assign({}, this.state, {
                      utxoMethodInProgress: false,
                    }));
                  }.bind(this));
                }.bind(this));
              }.bind(this);

              Store.dispatch(
                triggerToaster(
                  `${translate('TOASTR.AWAITING_TX_RESP')}...`,
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'info'
                )
              );

              function waterfallUTXOProcess() {
                Store.dispatch(
                  triggerToaster(
                    `${translate('TOASTR.PROCESSING_UTXO')}...`,
                    translate('TOASTR.WALLET_NOTIFICATION'),
                    'info'
                  )
                );

                getTxidData()
                .then(function(gettxdata) {
                  return processRefreshUTXOs(gettxdata.vin);
                })
                .then(function(new_utxos_set) {
                  return getDataCacheContents(new_utxos_set);
                })
                .then(function(save_this_data) {
                  return saveNewCacheData(save_this_data);
                });
              }

              let sentTxData = setInterval(function() {
                getTxidData()
                .then(function(gettxdata) {
                  if (gettxdata.vin &&
                      gettxdata.vin.length) {
                    clearInterval(sentTxData);
                    waterfallUTXOProcess();
                  }
                })
              }, 1000);
            }
          }.bind(this));
        } else {
          Store.dispatch(sendToAddressStateAlt(json));

          this.setState(Object.assign({}, this.state, {
            utxoMethodInProgress: false,
          }));
        }
      } else {
        Store.dispatch(sendToAddressStateAlt(json));
        Store.dispatch(
          triggerToaster(
            `${translate('TOASTR.SIGNED_TX_GENERATED_FAIL')}`,
            translate('TOASTR.WALLET_NOTIFICATION'),
            'error'
          )
        );

        this.setState(Object.assign({}, this.state, {
          utxoMethodInProgress: false,
        }));
      }

      // console.log(json);
    }.bind(this));
  }

  renderSignedTx(isRawTx) {
    let substrBlocks;

    if (this.props.ActiveCoin.mode === 'basilisk') {
      substrBlocks = isRawTx ? 3 : 8;
    } else {
      substrBlocks = 10;
    }

    const _lastSendToResponse = this.props.ActiveCoin.lastSendToResponse[isRawTx ? 'rawtx' : 'signedtx'];
    const substrLength = _lastSendToResponse.length / substrBlocks;
    let out = [];

    for (let i = 0; i < substrBlocks; i++) {
      out.push(
        <div key={ i }>{ _lastSendToResponse.substring(i * substrLength, substrLength * i + substrLength) }</div>
      );
    }

    return out.length ? out : null;
  }

  renderKey(key) {
    if (key === 'signedtx') {
      return this.renderSignedTx();
    } else if (key === 'rawtx') {
      return this.renderSignedTx(true);
    } else if (key === 'complete' || key === 'completed' || key === 'result') {
      const _lastSendToResponse = this.props.ActiveCoin.lastSendToResponse;

      if (_lastSendToResponse[key] === true ||
         _lastSendToResponse[key] === 'success') {
        return (
          <span className="label label-success">{ _lastSendToResponse[key] === true ? 'true' : 'success' }</span>
        );
      } else {
        if (key === 'result' &&
          _lastSendToResponse.result &&
          typeof _lastSendToResponse.result !== 'object') {
          return (
            <span>{ _lastSendToResponse.result }</span>
          );
        } else {
          return (
            <span className="label label-danger">false</span>
          );
        }
      }
    } else if (key === 'error') {
      const _lastSendToResponse = this.props.ActiveCoin.lastSendToResponse;

      if (Object.keys(_lastSendToResponse[key]).length) {
        return (
          <span>{ JSON.stringify(_lastSendToResponse[key], null, '\t') }</span>
        );
      } else {
        return (
          <span className="label label-danger">{ _lastSendToResponse[key] }</span>
        );
      }
    } else if (key === 'sendrawtransaction') {
      const _lastSendToResponse = this.props.ActiveCoin.lastSendToResponse;

      if (_lastSendToResponse[key] === 'success') {
        return (
          <span className="label label-success">true</span>
        );
      } else {
        return (
          <span className="label label-danger">false</span>
        );
      }
    } else if (key === 'txid' || key === 'sent') {
      const _lastSendToResponse = this.props.ActiveCoin.lastSendToResponse;

      return (
        <span>{ _lastSendToResponse[key] }</span>
      );
    } else if (key === 'tag') {
      return null;
    }
  }

  renderSendCoinResponse() {
    return SendCoinResponseRender.call(this);
  }

  // experimental, ask @kolo for details if required
  getOAdress() {
    resolveOpenAliasAddress(this.state.sendToOA)
    .then(function(json) {
      const reply = json.Answer;

      if (reply &&
          reply.length) {
        for (let i = 0; i < reply.length; i++) {
          const _address = reply[i].data.split(' ');
          const coin = _address[0].replace('"oa1:', '');
          const coinAddress = _address[1].replace('recipient_address=', '').replace(';', '');

          if (coin.toUpperCase() === this.props.ActiveCoin.coin) {
            this.setState(Object.assign({}, this.state, {
              sendTo: coinAddress,
            }));
          }
        }

        if (this.state.sendTo === '') {
          Store.dispatch(
            triggerToaster(
              'Couldn\'t find any ' + this.props.ActiveCoin.coin + ' addresses',
              'OpenAlias',
              'error'
            )
          );
        }
      } else {
        Store.dispatch(
          triggerToaster(
            'Couldn\'t find any addresses',
            'OpenAlias',
            'error'
          )
        );
      }
    }.bind(this));
  }

  renderOASendUI() {
    if (Config.openAlias) {
      return OASendUIRender.call(this);
    }

    return null;
  }

  renderSendApiTypeSelector() {
    if (this.props.ActiveCoin.mode === 'basilisk') {
      return SendApiTypeSelectorRender.call(this);
    }

    return null;
  }

  // TODO same as in walletsNav and receiveCoin, find a way to reuse it?
  checkBalance() {
    let _balance = '0';
    const _mode = this.props.ActiveCoin.mode;

    if (_mode === 'full') {
      _balance = this.props.ActiveCoin.balance || 0;
    } else if (_mode === 'basilisk') {
      if (this.props.ActiveCoin.cache) {
        const _cache = this.props.ActiveCoin.cache;
        const _coin = this.props.ActiveCoin.coin;
        const _address = this.props.ActiveCoin.activeAddress;

        if (_address &&
          _cache[_coin] &&
          _cache[_coin][_address] &&
          _cache[_coin][_address].getbalance &&
          _cache[_coin][_address].getbalance.data &&
          (_cache[_coin][_address].getbalance.data.balance ||
            _cache[_coin][_address].getbalance.data.interest)) {
          const _regBalance = _cache[_coin][_address].getbalance.data.balance ? _cache[_coin][_address].getbalance.data.balance : 0;

          _balance = _regBalance;
        }
      }
    }

    return _balance;
  }

  // TODO: reduce to a single toast
  validateSendFormData() {
    let valid = true;
    if (!this.state.sendTo || this.state.sendTo.length < 34) {
      Store.dispatch(
        triggerToaster(
          translate('SEND.SEND_TO_ADDRESS_MIN_LENGTH'),
          '',
          'error'
        )
      );
      valid = false;
    }

    if (!isPositiveNumber(this.state.amount)) {
      Store.dispatch(
        triggerToaster(
          translate('SEND.AMOUNT_POSITIVE_NUMBER'),
          '',
          'error'
        )
      );
      valid = false;
    }

    if (!isPositiveNumber(this.state.fee)) {
      Store.dispatch(
        triggerToaster(
          translate('SEND.FEE_POSITIVE_NUMBER'),
          '',
          'error'
        )
      );
      valid = false;
    }

    if (!isPositiveNumber(this.getTotalAmount())) {
      Store.dispatch(
        triggerToaster(
          translate('SEND.TOTAL_AMOUNT_POSITIVE_NUMBER'),
          '',
          'error'
        )
      );
      valid = false;
    }

    /*if ((this.props.ActiveCoin.mode === 'basilisk' && Number(this.state.amount) > Number(this.state.sendFromAmount)) ||
        (this.props.ActiveCoin.mode === 'full' && Number(this.state.amount) > Number(this.checkBalance()))) {
      Store.dispatch(
        triggerToaster(
          translate('SEND.INSUFFICIENT_FUNDS'),
          '',
          'error'
        )
      );
      valid = false;
    }*/

    return valid;
  }

  getTotalAmount() {
    return Number(this.state.amount) - Number(this.state.fee);
  }

  render() {
    if (this.props.ActiveCoin &&
        this.props.ActiveCoin.send &&
        this.props.ActiveCoin.mode !== 'native') {
      return SendCoinRender.call(this);
    }

    return null;
  }
}

const mapStateToProps = (state) => {
  return {
    ActiveCoin: {
      coin: state.ActiveCoin.coin,
      mode: state.ActiveCoin.mode,
      send: state.ActiveCoin.send,
      receive: state.ActiveCoin.receive,
      balance: state.ActiveCoin.balance,
      cache: state.ActiveCoin.cache,
      activeAddress: state.ActiveCoin.activeAddress,
      lastSendToResponse: state.ActiveCoin.lastSendToResponse,
      addresses: state.ActiveCoin.addresses,
    },
    Dashboard: {
      activeHandle: state.Dashboard.activeHandle,
    },
  };
};

export default connect(mapStateToProps)(SendCoin);
import React from 'react';
import WalletsBalance from '../walletsBalance/walletsBalance';
import WalletsInfo from '../walletsInfo/walletsInfo';
import SendCoin from '../sendCoin/sendCoin';
import WalletsProgress from '../walletsProgress/walletsProgress';
import WalletsData from '../walletsData/walletsData';
import ReceiveCoin from '../receiveCoin/receiveCoin';
import {
  getCoinTitle,
  isKomodoCoin,
} from '../../../util/coinHelper';
import translate from '../../../translate/translate';

const WalletsMainRender = function() {
  const _coin = this.props.ActiveCoin.coin;

  return (
    <div className="page margin-left-0">
      <div className="padding-top-0">
        <div
          id="easydex-header-div"
          className="background-color-white"
          style={ this.getCoinStyle('transparent') }>
          <ol className={ 'coin-logo breadcrumb' + (_coin === 'KMD' || _coin === 'JUMBLR' || _coin === 'MESH' || _coin === 'MVP' ? ' coin-logo-wide' : '') + ' native-coin-logo' }>
            <li className="header-easydex-section">
              { this.getCoinStyle('title') &&
                <img
                  className={ 'coin-icon' + (_coin === 'KMD' ? ' kmd' : '') }
                  src={ this.getCoinStyle('title') } />
              }
              { _coin === 'KMD' &&
                <img
                  className="kmd-mobile-icon"
                  src={ `assets/images/cryptologo/${_coin.toLowerCase()}.png` } />
              }
              <span className={ `margin-left-20 easydex-section-image ${(_coin === 'KMD' || _coin === 'JUMBLR' || _coin === 'MESH' || _coin === 'MVP' ? 'hide' : '')}` }>
                { translate((isKomodoCoin(_coin) ? 'ASSETCHAINS.' : 'CRYPTO.') + _coin.toUpperCase()) }
              </span>
            </li>
          </ol>
        </div>
        <div className="page-content page-content-native">
          { this.props.ActiveCoin.mode !== 'spv' &&
            <WalletsProgress />
          }
          <div className="row">
            <WalletsBalance />
            <ReceiveCoin />
            <WalletsData />
            <SendCoin />
            <WalletsInfo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletsMainRender;
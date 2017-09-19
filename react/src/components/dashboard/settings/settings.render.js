import React from 'react';
import { translate } from '../../../translate/translate';
import PanelSection from './settings.panelBody';
import Panel from './settings.panel';

import AppUpdatePanel from  './settings.appUpdatePanel';
import AppInfoPanel from  './settings.appInfoPanel';
import AddNodePanel from './settings.addNodePanel';
import AppSettingsPanel from './settings.appSettingsPanel';
import CliPanel from './settings.cliPanel';
import DebugLogPanel from './settings.debugLogPanel';
import FiatCurrencyPanel from './settings.fiatCurrencyPanel';
import ExportKeysPanel from './settings.exportKeysPanel';
import ImportKeysPanel from './settings.importKeysPanel';
import SupportPanel from './settings.supportPanel';
import WalletInfoPanel from './settings.walletInfoPanel';
import WalletBackupPanel from './settings.walletBackupPanel';

export const SettingsRender = function() {
  return (
    <div 
      id="section-iguana-wallet-settings"
      className="padding-30">
        <div className="row">
          <div className="col-sm-12">
            <h4 className="font-size-14 text-uppercase">{ translate('INDEX.WALLET_SETTINGS') }</h4>
            <Panel
              uniqId={'SettingsAccordion'}
              singleOpen={true}>
              { !this.props.disableWalletSpecificUI &&
                <PanelSection
                  title={ translate('INDEX.WALLET_INFO') }
                  icon="icon md-balance-wallet"
                  openByDefault={!this.props.disableWalletSpecificUI}>
                  <WalletInfoPanel />
                </PanelSection>
              }
              { !this.props.disableWalletSpecificUI &&
                <PanelSection
                  title={ translate('INDEX.ADD_NODE') }
                  icon="icon md-plus-square">
                  <AddNodePanel />
                </PanelSection>
              }
              { !this.props.disableWalletSpecificUI &&
                <PanelSection
                  title={ translate('INDEX.WALLET_BACKUP') }
                  icon="icon wb-briefcase">
                  <WalletBackupPanel />
                </PanelSection>
              }
              { !this.props.disableWalletSpecificUI &&
                <PanelSection
                  title={ translate('INDEX.FIAT_CURRENCY') }
                  icon="icon fa-money">
                  <FiatCurrencyPanel />
                </PanelSection>
              }
              { !this.props.disableWalletSpecificUI &&
                <PanelSection
                  title={ translate('INDEX.EXPORT_KEYS') }
                  icon="icon md-key">
                  <ExportKeysPanel />
                </PanelSection>
              }
              { !this.props.disableWalletSpecificUI &&
                <PanelSection
                  title={ translate('INDEX.IMPORT_KEYS') }
                  icon="icon md-key">
                  <ImportKeysPanel />
                </PanelSection>
              }
                <PanelSection
                  title={ translate('INDEX.DEBUG_LOG') }
                  icon="icon fa-bug"
                  openByDefault={this.props.disableWalletSpecificUI}>                    
                  <DebugLogPanel />
                </PanelSection>
                <PanelSection
                    title={ translate('SETTINGS.APP_CONFIG') + ' (config.json)' }
                    icon="icon fa-bug">
                    <AppSettingsPanel />
                </PanelSection>
                <PanelSection
                  title={ translate('SETTINGS.APP_INFO') }
                  icon="icon md-info">
                  <AppInfoPanel />
                </PanelSection>
              { this.props.Main && this.props.Main.coins.native &&
                <PanelSection
                  title="CLI"
                  icon="icon fa-code">
                  <CliPanel />
                </PanelSection>
              }
                <PanelSection
                  title={ translate('INDEX.UPDATE') }
                  icon="icon fa fa-cloud-download">
                  <AppUpdatePanel />
                </PanelSection>
                <PanelSection
                  title="Support"
                  icon="icon fa fa-life-ring">
                  <SupportPanel />
                </PanelSection>
            </Panel>
          </div>
        </div>
      </div>
  );
};
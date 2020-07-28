import React, { Component } from 'react';
import { update_state } from '../utils';
import { get_data, APP_URLS } from '../urls';
import { isString } from 'lodash';
import Axios from 'axios';
import { LibraryAssetsState, LibraryAsset, AssetGroup } from 'js/types';
import { LibraryAssetsContext } from './contexts';



export default class LibAssetsProvider extends Component<{}, LibraryAssetsState> {

    update_state: (update_func: (draft: LibraryAssetsState) => void) => Promise<void>
    constructor(props: {}) {
        super(props)

        this.state = {
            initialized: true,
            loaded: false,
            error: {
                is_error: false,
                message: ""
            },
            assets: []
        }

        this._set_error_state = this._set_error_state.bind(this)
        this.refresh_assets = this.refresh_assets.bind(this)
        this.update_state = update_state.bind(this)

        this.add_library_asset = this.add_library_asset.bind(this)
        this.edit_library_asset = this.edit_library_asset.bind(this)
        this.delete_library_asset = this.delete_library_asset.bind(this)
    }

    componentDidMount() {
        this.refresh_assets()
    }

    async _set_error_state(err_msg:any) {
        this.update_state(draft => {
            draft.loaded = true
            draft.error = {
                is_error: true,
                message: isString(err_msg) ? err_msg : "Unknown Error"
            }
            draft.assets = []
        })
    }

    // Updates the library assets held in state to reflect what is returned by the server
    // Returns a promise to reflect when the assets are fully refreshed
    async refresh_assets() {
        return this.update_state(draft => { draft.loaded = false })
        .then(() => get_data(APP_URLS.LIBRARY_ASSETS))
        .then((library_assets: LibraryAsset[]) => {
            this.update_state(draft => {
                draft.loaded = true
                draft.error = {
                    is_error: false,
                    message: ""
                }
                draft.assets = library_assets
            })
        }, this._set_error_state)
    }

    async add_library_asset(image: File, group: AssetGroup) {
        return Axios.post(APP_URLS.LIBRARY_ASSETS, {
            image_file: image,
            image_group: group
        }).finally(this.refresh_assets)
    }

    async edit_library_asset(old_asset: LibraryAsset, new_image: File, new_group: AssetGroup) {
        return Axios.patch(APP_URLS.LIBRARY_ASSET_ITEM(old_asset.id), {
            image_file: new_image,
            image_group: new_group
        }).finally(this.refresh_assets)
    }

    async delete_library_asset(old_asset: LibraryAsset) {
        return Axios.delete(APP_URLS.LIBRARY_ASSET_ITEM(old_asset.id))
        .finally(this.refresh_assets)
    }

    render() {
        return (
            <LibraryAssetsContext.Provider
                value={{
                    state: this.state,
                    refresh_assets: this.refresh_assets,
                    add_library_asset: this.add_library_asset,
                    edit_library_asset: this.edit_library_asset,
                    delete_library_asset: this.delete_library_asset
                }}
            >
                {this.props.children}
            </LibraryAssetsContext.Provider>
        )
    }
}
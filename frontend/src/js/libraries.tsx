import React from 'react';
import { Grid, Box, Typography, Link, Button, TextField, Checkbox } from '@material-ui/core';
import { Folder, InsertDriveFile, DoubleArrow } from '@material-ui/icons';
import { LibraryVersionsAPI, LibraryVersion, field_info, UsersAPI, LibraryAssetsAPI, SerializedContent, MetadataAPI, ContentsAPI, User, LibraryFolder } from './types';
import {
    Grid as DataGrid,
    Table,
    TableHeaderRow,
} from "@devexpress/dx-react-grid-material-ui"
import prettyBytes from 'pretty-bytes';
import ActionPanel from './reusable/action_panel';
import ActionDialog from './reusable/action_dialog';
import { cloneDeep } from 'lodash';
import { get_field_info_default, update_state } from './utils';
import VALIDATORS from './validators';
import { ViewContentModal } from './reusable/view_content_modal';
import ContentSearch from './reusable/content_search';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { format } from 'date-fns';
import KebabMenu from './reusable/kebab_menu';

interface LibrariesProps {
    users_api: UsersAPI
    library_assets_api: LibraryAssetsAPI
    library_versions_api: LibraryVersionsAPI
    metadata_api: MetadataAPI
    contents_api: ContentsAPI
}

interface LibrariesState {
    modals: LibrariesModals
    selected_folders: LibraryFolder[]
    selected_files: SerializedContent[]
}

interface LibrariesModals {
    add_version: {
        is_open: boolean
        name: field_info<string>
        number: field_info<string>
        banner: field_info<number>
        created_by: User
    }
    edit_version: {
        is_open: boolean
        version: LibraryVersion
        name: field_info<string>
        number: field_info<string>
        created_by: User
    }
    delete_version: {
        is_open: boolean
        to_delete: LibraryVersion
        name: field_info<string>
    }
    view_content: {
        is_open: boolean
        row: SerializedContent
    }
    set_banner: {
        is_open: boolean
    }
    add_folder: {
        is_open: boolean
        parent: LibraryFolder | null
        name: field_info<string>
    }
    rename_folder: {
        is_open: boolean
        to_rename: LibraryFolder
        name: field_info<string>
    }
    delete_folder: {
        is_open: boolean
        name: field_info<string>
        to_delete: LibraryFolder
    }
    set_folder_banner: {
        is_open: boolean
        to_change: LibraryFolder
    }
    set_folder_logo: {
        is_open: boolean
        to_change: LibraryFolder
    }
    move_content: {
        is_open: boolean
        destination_folder: [LibraryFolder, string]
    }
}

export default class Libraries extends React.Component<LibrariesProps, LibrariesState> {
    modal_defaults: LibrariesModals
    library_version_default: LibraryVersion
    library_folder_default: LibraryFolder
    content_defaults: SerializedContent
    user_defaults: User
    auto_complete_filter: any
    update_state: (update_func: (draft: LibrariesState) => void) => Promise<void>
    constructor(props: LibrariesProps) {
        super(props)

        this.library_version_default = {
            id: 0,
            library_name: "",
            version_number: "",
            library_banner: 0,
            created_by: 0
        }

        this.content_defaults = {
            id: 0,
            file_name: "",
            filesize: 0,
            content_file: "",
            title: "",
            description: null,
            modified_on: "",
            reviewed_on: "",
            copyright: null,
            rights_statement: null,
            active: false,
            duplicatable: false,
            metadata: [],
            metadata_info: [],
            published_year: ""
        }
        
        this.user_defaults = {
            id: 0,
            name: ""
        }

        this.library_folder_default = {
            id: 0,
            banner_img: 0,
            folder_name: "",
            library_content: [],
            logo_img: 0,
            parent: null,
            version: 0
        }

        this.modal_defaults = {
            add_version: {
                is_open: false,
                name: get_field_info_default(""),
                number: get_field_info_default(""),
                banner: get_field_info_default(0),
                created_by: cloneDeep(this.user_defaults)
            },
            edit_version: {
                is_open: false,
                version: cloneDeep(this.library_version_default),
                name: get_field_info_default(""),
                number: get_field_info_default(""),
                created_by: cloneDeep(this.user_defaults),
            },
            delete_version: {
                is_open: false,
                to_delete: this.library_version_default,
                name: get_field_info_default("")
            },
            view_content: {
                is_open: false,
                row: cloneDeep(this.content_defaults)
            },
            set_banner: {
                is_open: false
            },
            add_folder: {
                is_open: false,
                parent: null,
                name: get_field_info_default("")
            },
            rename_folder: {
                is_open: false,
                name: get_field_info_default(""),
                to_rename: cloneDeep(this.library_folder_default)
            },
            delete_folder: {
                is_open: false,
                name: get_field_info_default(""),
                to_delete: cloneDeep(this.library_folder_default)
            },
            set_folder_banner: {
                is_open: false,
                to_change: cloneDeep(this.library_folder_default)
            },
            set_folder_logo: {
                is_open: false,
                to_change: cloneDeep(this.library_folder_default)
            },
            move_content: {
                is_open: false,
                destination_folder: [cloneDeep(this.library_folder_default), ""]
            }
        }

        this.state = {
            modals: cloneDeep(this.modal_defaults),
            selected_files: [],
            selected_folders: []
        }

        this.auto_complete_filter = createFilterOptions<User>({
            ignoreCase: true
        })

        this.update_state = update_state.bind(this)
        this.close_modals = this.close_modals.bind(this)
        this.reset_selection = this.reset_selection.bind(this)
    }

    async close_modals() {
        return this.update_state(draft => {
            draft.modals = cloneDeep(this.modal_defaults)
        })
    }

    async reset_selection() {
        return this.update_state(draft => {
            draft.selected_files = []
            draft.selected_folders = []
        })
    }

    render() {
        const {
            library_versions_api,
            users_api,
            metadata_api,
            contents_api
        } = this.props
        return (
            <>
                <Grid container spacing={2} style={{paddingLeft: "15px", paddingRight: "15px"}}>
                    <Grid item sm={3}>
                        <Box display="flex" flexDirection="row">
                            <Typography variant="h3" style={{marginBottom: "5px"}}>Library Versions</Typography>
                            <Button
                                onClick={_ => {
                                    this.update_state(draft => {
                                        draft.modals.add_version.is_open = true
                                    })
                                }}
                                style={{
                                    marginLeft: "1em",
                                    marginBottom: "1em",
                                    backgroundColor: "#75b2dd",
                                    color: "#FFFFFF"
                                }}
                            >
                                New Version
                            </Button>
                        </Box>
                        <DataGrid
                            columns={[
                                {name: "actions", title: "Actions", getCellValue: (row: LibraryVersion) => (
                                    <ActionPanel
                                        viewFn={() => {
                                            library_versions_api.enter_version_root(row)
                                        }}
                                        deleteFn={() => {
                                            this.update_state(draft => {
                                                draft.modals.delete_version.is_open = true
                                                draft.modals.delete_version.to_delete = row
                                            })
                                        }}
                                        editFn={() => {
                                            this.update_state(draft => {
                                                draft.modals.edit_version.is_open = true
                                                draft.modals.edit_version.version = cloneDeep(row)
                                                draft.modals.edit_version.name.value = row.library_name
                                                draft.modals.edit_version.number.value = row.version_number
                                                const user = this.props.users_api.state.users.find(user => user.id === row.created_by)
                                                if (user !== undefined) {
                                                    draft.modals.edit_version.created_by = user
                                                }
                                            })
                                        }}
                                        imageFn={() => {
                                            library_versions_api.enter_version_root(row)
                                            .then(() => {
                                                this.update_state(draft => {
                                                    draft.modals.set_banner.is_open = true
                                                })
                                            })
                                        }}
                                        cloneFn={() => {
                                            library_versions_api.clone_version(row)
                                        }}
                                    />
                                )},
                                {name: "library_name", title: "Name"},
                                {name: "version_number", title: "Version"},
                                {name: "created_by_name", title: "Creator", getCellValue: (row: LibraryVersion) => {
                                    const user = this.props.users_api.state.users.find(user => user.id === row.created_by)
                                    return user === undefined ? "None" : user.name
                                }},
                                {name: "created_on", title: "Created On"}
                            ]}
                            
                            rows={library_versions_api.state.library_versions.map((version: any) => {
                                const cloned = cloneDeep(version)
                                cloned.created_on = format(
                                    new Date(version.created_on),
                                    "MM/dd/yyyy"
                                    )
                                return cloned
                            })}
                        >
                            <Table
                                columnExtensions={[
                                    {columnName: 'actions', width: 170}
                                ]}
                            />
                            <TableHeaderRow />
                        </DataGrid>
                    </Grid>
                    <Grid item sm={3}>
                        {
                            this.props.library_versions_api.state.current_version.id !== 0 ?
                            <Box display="flex" flexDirection="row">
                                <Button
                                    onClick={_ => {
                                        this.update_state(draft => {
                                            draft.modals.add_folder.is_open = true
                                        })
                                    }}
                                    style={{
                                        marginLeft: "1em",
                                        marginBottom: "1em",
                                        backgroundColor: "#75b2dd",
                                        color: "#FFFFFF"
                                    }}
                                >
                                    Add Folder
                                </Button>
                            </Box> : <></>
                        }
                        {(() => {
                            const library_banner = this.props.library_versions_api.state.current_version.library_banner
                            if (library_banner !== 0) {
                                const version_banner = this.props.library_assets_api.state.assets_by_group[3]?.find(asset => asset.id === library_banner)
                                if (version_banner !== undefined && version_banner.image_file !== null) {
                                    return <img src={version_banner.image_file} style={{maxHeight: "200px", maxWidth: "100%"}}></img>
                                } else {
                                    return <></>
                                }
                            } else {
                                return <></>
                            }
                        })()}
                        <Grid container style={{maxHeight: "200px"}}>
                            <Grid item xs={6}>
                                {(() => {
                                    const path = this.props.library_versions_api.state.path
                                    const top_level_folder = path.length > 0 ? path[0] : undefined
                                    if (top_level_folder !== undefined) {
                                        const folder_banner = this.props.library_assets_api.state.assets_by_group[2]?.find(asset => asset.id === top_level_folder.banner_img)
                                        if (folder_banner !== undefined && folder_banner.image_file !== null) {
                                            return <img src={folder_banner.image_file} style={{maxHeight: "200px", maxWidth: "100%"}}></img>
                                        } else {
                                            return <></>
                                        }
                                    } else {
                                        return <></>
                                    }
                                })()}
                            </Grid>
                            <Grid item xs={6}>
                                {(() => {
                                    const path = this.props.library_versions_api.state.path
                                    const top_level_folder = path.length > 0 ? path[0] : undefined
                                    if (top_level_folder !== undefined) {
                                        const folder_logo = this.props.library_assets_api.state.assets_by_group[1]?.find(asset => asset.id === top_level_folder.logo_img)
                                        if (folder_logo !== undefined && folder_logo.image_file !== null) {
                                            return <img src={folder_logo.image_file} style={{maxHeight: "200px", maxWidth: "100%"}}></img>
                                        } else {
                                            return <></>
                                        }
                                    } else {
                                        return <></>
                                    }
                                })()}
                            </Grid>
                        </Grid>
                        
                        <Box flexDirection="row" display="flex">
                            {
                                [
                                    (() => {
                                        const name = library_versions_api.state.current_version.library_name
                                        return (
                                            <Box key={0} flexDirection="row" display="flex">
                                                <Typography>
                                                    {name === "" ? "None" : (
                                                        <Link
                                                            style={{cursor: "pointer"}}
                                                            onClick={() => library_versions_api.enter_version_root(library_versions_api.state.current_version).then(this.reset_selection)}
                                                        >
                                                            {name}
                                                        </Link>
                                                    )}
                                                </Typography>
                                                <DoubleArrow />
                                            </Box>
                                        )
                                    })()
                                ].concat(library_versions_api.state.path.map((folder, idx) => (
                                    <Box key={idx+1} flexDirection="row" display="flex">
                                        <Typography>
                                            <Link
                                                style={{cursor: "pointer"}}
                                                onClick={() => {
                                                    library_versions_api.enter_folder(folder, library_versions_api.state.path.length - idx - 1).then(this.reset_selection)
                                                }}
                                            >
                                                {folder.folder_name}
                                            </Link>
                                        </Typography>
                                        <DoubleArrow />
                                    </Box>
                                )))
                            }
                        </Box>
                        {library_versions_api.state.current_directory.folders.map((folder, idx) => (
                            <Box key={idx} display="flex" flexDirection="row" width="100%">
                                <Box>
                                    <Checkbox
                                        checked={this.state.selected_folders.find(item => item.id === folder.id) !== undefined}
                                        onChange={(_evt, checked) => {
                                            this.update_state(draft => {
                                                draft.selected_folders = checked ?
                                                    draft.selected_folders.concat(folder) :
                                                    draft.selected_folders.filter(item => item.id !== folder.id)
                                            })
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Folder />
                                </Box>
                                <Box>
                                    <Typography>
                                        <Link
                                            style={{cursor: "pointer"}}
                                            onClick={() => {
                                                library_versions_api.enter_folder(folder).then(this.reset_selection)
                                            }}
                                        >
                                            {folder.folder_name}
                                        </Link>
                                    </Typography>
                                </Box>
                                <Box marginLeft="auto">
                                    <KebabMenu
                                        items={([
                                            [
                                                () => {
                                                    this.update_state(draft => {
                                                        draft.modals.delete_folder.is_open = true
                                                        draft.modals.delete_folder.to_delete = cloneDeep(folder)
                                                    })
                                                }, "Delete"
                                            ], [
                                                () => {
                                                    this.update_state(draft => {
                                                        draft.modals.rename_folder.is_open = true
                                                        draft.modals.rename_folder.to_rename = cloneDeep(folder)
                                                    })
                                                }, "Rename"
                                            ]
                                        ] as [() => void, string][]).concat(
                                            //If we are in the top level version add set folder and set logo menu items
                                            library_versions_api.state.path.length === 0 ?
                                            [
                                                [
                                                    () => {
                                                        this.update_state(draft => {
                                                            draft.modals.set_folder_banner.is_open = true
                                                            draft.modals.set_folder_banner.to_change = cloneDeep(folder)
                                                        })
                                                    }, "Set Banner"
                                                ], [
                                                    () => {
                                                        this.update_state(draft => {
                                                            draft.modals.set_folder_logo.is_open = true
                                                            draft.modals.set_folder_logo.to_change = cloneDeep(folder)
                                                        })
                                                    }, "Set Logo"
                                                ]
                                            ] : []
                                        )}
                                    />
                                </Box>
                            </Box>
                        ))}
                        {library_versions_api.state.current_directory.files.map((content: SerializedContent, idx) => (
                            <Box
                                key={library_versions_api.state.current_directory.folders.length + idx}
                                display="flex"
                                flexDirection="row"
                                width="100%"
                            >
                                <Box>
                                    <Checkbox
                                        checked={this.state.selected_files.find(item => item.id === content.id) !== undefined}
                                        onChange={(_evt, checked) => {
                                            this.update_state(draft => {
                                                draft.selected_files = checked ?
                                                    draft.selected_files.concat(content) :
                                                    draft.selected_files.filter(item => item.id !== content.id)
                                            })
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <InsertDriveFile />
                                </Box>
                                <Box>
                                    <Typography>
                                        <Link
                                            style={{cursor: "pointer"}}
                                            onClick={() => {
                                                this.update_state(draft => {
                                                    draft.modals.view_content.is_open = true
                                                    draft.modals.view_content.row = content
                                                })
                                            }}
                                        >
                                            {content.title}
                                        </Link>
                                    </Typography>
                                </Box>
                                <Box marginLeft="auto" minWidth={35}>
                                    <Typography>{prettyBytes(content.filesize === null ? 0 : content.filesize)}</Typography>
                                </Box>
                                <Box>
                                    <KebabMenu
                                        items={[
                                            [
                                                () => {
                                                    const path = this.props.library_versions_api.state.path
                                                    this.props.library_versions_api.remove_content_from_folder(
                                                        path[path.length -1], this.state.selected_files
                                                    )
                                                },
                                                "Remove Selected"
                                            ],
                                            [
                                                () => {
                                                    this.update_state(draft => {
                                                        draft.modals.move_content.is_open = true
                                                    })
                                                },
                                                "Move Selected"
                                            ]
                                        ]}
                                    />
                                </Box>
                            </Box>
                        ))}
                        {// Displays an empty message if there are no folders or files in the current directory
                            library_versions_api.state.current_directory.folders.length === 0 &&
                            library_versions_api.state.current_directory.files.length === 0 ? (
                                <Typography style={{fontStyle: "italic"}}>No Files or Folders</Typography>
                            ) : <></>
                        }
                    </Grid>
                    <Grid item sm={6}>
                        <Button onClick={() => {
                            const path = this.props.library_versions_api.state.path
                            const cd = path.length > 0 ? path[path.length - 1] : undefined
                            if (cd) {
                                this.props.contents_api.add_selected_to_folder(cd).then(
                                    this.props.library_versions_api.refresh_current_directory
                                )
                            }
                        }}>Add Selected to CD</Button>
                        <ContentSearch
                            contents_api={contents_api}
                            metadata_api={metadata_api}
                            versions_api={library_versions_api}
                            selection
                            on_view={row => {
                                this.update_state(draft => {
                                    draft.modals.view_content.is_open = true
                                    draft.modals.view_content.row = row
                                })
                            }}
                        />
                    </Grid>
                </Grid>
                <ActionDialog
                    on_close={this.close_modals}
                    open={this.state.modals.add_version.is_open}
                    title={"Add a Library Version"}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={async () => {
                                this.update_state(draft => {
                                    draft.modals.add_version.name.reason = VALIDATORS.VERSION_NAME(draft.modals.add_version.name.value)
                                    draft.modals.add_version.number.reason = VALIDATORS.VERSION_NUMBER(draft.modals.add_version.number.value)
                                }).then(() => {
                                    return library_versions_api.add_version(
                                        this.state.modals.add_version.name.value,
                                        this.state.modals.add_version.number.value,
                                        this.state.modals.add_version.created_by.id
                                    )
                                }).then(this.close_modals)
                            }}
                            color="primary"
                        >
                            Add
                        </Button>
                    )]}
                >
                    <TextField
                        fullWidth
                        label={"Version Name"}
                        value={this.state.modals.add_version.name.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.add_version.name.value = evt.target.value
                            })
                        }}
                    />
                    <TextField
                        fullWidth
                        label={"Version Number"}
                        value={this.state.modals.add_version.number.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.add_version.number.value = evt.target.value
                            })
                        }}
                    />
                    <Autocomplete
                        value={this.state.modals.add_version.created_by}
                        onChange={(_evt, value: User | null) => {
                            if (value?.id === -1) {
                                users_api.add_user(value.name).then(() => {
                                    const new_user = this.props.users_api.state.users.find(user => user.name == value.name)
                                    if (new_user !== undefined) {
                                        this.update_state(draft => {
                                            draft.modals.add_version.created_by = new_user
                                        })
                                    }
                                })
                            } else if (!(value === null)) {
                                this.update_state(draft => {
                                    draft.modals.add_version.created_by = value
                                })
                            }
                        }}
                        filterOptions={(options, params) => {
                            const filtered = this.auto_complete_filter(options, params)
                            if (params.inputValue !== "") {
                                filtered.push({
                                    id: -1,
                                    name: params.inputValue
                                } as User)
                            }
                            return filtered
                        }}
                        handleHomeEndKeys
                        options={users_api.state.users}
                        getOptionLabel={option => {
                            return option.id === -1 ? `Add new User "${option.name}"` : option.name
                        }}
                        renderInput={params => (
                            <TextField
                                {...params}
                                variant={"standard"}
                                placeholder={"User"}
                            />
                        )}
                    />
                </ActionDialog>
                <ActionDialog
                    on_close={this.close_modals}
                    open={this.state.modals.edit_version.is_open}
                    title={"Edit a Library Version"}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={() => {
                                this.update_state(draft => {
                                    draft.modals.edit_version.name.reason = VALIDATORS.VERSION_NAME(draft.modals.edit_version.name.value)
                                    draft.modals.edit_version.number.reason = VALIDATORS.VERSION_NUMBER(draft.modals.edit_version.number.value)
                                }).then(() => {
                                    return library_versions_api.update_version(
                                        this.state.modals.edit_version.version,
                                        this.state.modals.edit_version.name.value || undefined,
                                        this.state.modals.edit_version.number.value || undefined,
                                        this.state.modals.edit_version.created_by.id !== 0 ? this.state.modals.edit_version.created_by : undefined
                                    )
                                }).then(this.close_modals)
                            }}
                            color="primary"
                        >
                            Edit
                        </Button>
                    )]}
                >
                    <TextField
                        fullWidth
                        label={"Version Name"}
                        value={this.state.modals.edit_version.name.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.edit_version.name.value = evt.target.value
                            })
                        }}
                    />
                    <TextField
                        fullWidth
                        label={"Version Number"}
                        value={this.state.modals.edit_version.number.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.edit_version.number.value = evt.target.value
                            })
                        }}
                    />
                    <Autocomplete
                        value={this.state.modals.edit_version.created_by}
                        onChange={(_evt, value: User | null) => {
                            if (value?.id === -1) {
                                users_api.add_user(value.name).then(() => {
                                    const new_user = this.props.users_api.state.users.find(user => user.name == value.name)
                                    if (new_user !== undefined) {
                                        this.update_state(draft => {
                                            draft.modals.edit_version.created_by = new_user
                                        })
                                    }
                                })
                            } else if (!(value === null)) {
                                this.update_state(draft => {
                                    draft.modals.edit_version.created_by = value
                                })
                            }
                        }}
                        filterOptions={(options, params) => {
                            const filtered = this.auto_complete_filter(options, params)
                            if (params.inputValue !== "") {
                                filtered.push({
                                    id: -1,
                                    name: params.inputValue
                                } as User)
                            }
                            return filtered
                        }}
                        handleHomeEndKeys
                        options={users_api.state.users}
                        getOptionLabel={option => {
                            return option.id === -1 ? `Add new User "${option.name}"` : option.name
                        }}
                        renderInput={params => (
                            <TextField
                                {...params}
                                variant={"standard"}
                                placeholder={"User"}
                            />
                        )}
                    />
                </ActionDialog>
                <ActionDialog
                    on_close={this.close_modals}
                    open={this.state.modals.set_banner.is_open}
                    title={"Set Library Banner"}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Grid container spacing={2}>
                        {this.props.library_assets_api.state.assets_by_group[3]?.map((asset, idx) => {
                            return (
                                <Grid
                                    key={idx}
                                    item
                                    style={this.props.library_versions_api.state.current_version.library_banner === asset.id
                                    ? {backgroundColor: "#75b2dd"} : undefined}
                                    onClick={_ => {
                                        this.props.library_versions_api.set_version_image(asset)
                                        .then(this.close_modals)
                                    }}
                                >
                                    <img
                                        src={asset.image_file === null ? "" : asset.image_file}
                                        style={{maxHeight: "100px", maxWidth: "100px"}}
                                    />
                                </Grid>
                            )
                        })}
                    </Grid>
                </ActionDialog>
                <ActionDialog
                    on_close={this.close_modals}
                    open={this.state.modals.set_folder_banner.is_open}
                    title={"Set Folder Banner"}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Grid container spacing={2}>
                        {this.props.library_assets_api.state.assets_by_group[2]?.map((asset, idx) => {
                            return (
                                <Grid
                                    key={idx}
                                    item
                                    style={this.state.modals.set_folder_banner.to_change.banner_img === asset.id
                                    ? {backgroundColor: "#75b2dd"} : undefined}
                                    onClick={_ => {
                                        this.props.library_versions_api.set_folder_banner(this.state.modals.set_folder_banner.to_change, asset)
                                        .then(this.close_modals)
                                    }}
                                >
                                    <img
                                        src={asset.image_file === null ? "" : asset.image_file}
                                        style={{maxHeight: "100px", maxWidth: "100px"}}
                                    />
                                </Grid>
                            )
                        })}
                    </Grid>
                </ActionDialog>
                <ActionDialog
                    on_close={this.close_modals}
                    open={this.state.modals.set_folder_logo.is_open}
                    title={"Set Folder Logo"}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Grid container spacing={2}>
                        {this.props.library_assets_api.state.assets_by_group[1]?.map((asset, idx) => {
                            return (
                                <Grid
                                    key={idx}
                                    item
                                    style={this.state.modals.set_folder_logo.to_change.banner_img === asset.id
                                    ? {backgroundColor: "#75b2dd"} : undefined}
                                    onClick={_ => {
                                        this.props.library_versions_api.set_folder_logo(this.state.modals.set_folder_logo.to_change, asset)
                                        .then(this.close_modals)
                                    }}
                                >
                                    <img
                                        src={asset.image_file === null ? "" : asset.image_file}
                                        style={{maxHeight: "100px", maxWidth: "100px"}}
                                    />
                                </Grid>
                            )
                        })}
                    </Grid>
                </ActionDialog>
                <ActionDialog
                    title={`Delete Version ${this.state.modals.delete_version.to_delete.library_name}?`}
                    open={this.state.modals.delete_version.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                this.update_state(draft => {
                                    draft.modals.delete_version.name.reason = VALIDATORS.DELETE_IF_EQUALS(
                                        draft.modals.delete_version.name.value, this.state.modals.delete_version.to_delete.library_name
                                    )
                                }).then(() => {
                                    if (this.state.modals.delete_version.name.reason === "") {
                                        this.props.library_versions_api.delete_version(
                                            this.state.modals.delete_version.to_delete
                                        ).then(this.close_modals)
                                    }
                                })
                            }}
                            color="secondary"
                        >
                            Delete
                        </Button>
                    ), (
                        <Button
                            key={2}
                            onClick={this.close_modals}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Typography>This action is irreversible. Please enter {this.state.modals.delete_version.to_delete.library_name} to confirm deletion</Typography>
                    <TextField
                        fullWidth
                        error={this.state.modals.delete_version.name.reason === ""}
                        helperText={this.state.modals.delete_version.name.reason}
                        value={this.state.modals.delete_version.name.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.delete_version.name.value = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ViewContentModal
                    is_open={this.state.modals.view_content.is_open}
                    on_close={this.close_modals}
                    metadata_api={metadata_api}
                    row={this.state.modals.view_content.row}
                />
                <ActionDialog
                    title={"Add New Folder"}
                    actions={[(
                        <Button
                            key={2}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={() => {
                                this.update_state(draft => {
                                    draft.modals.add_folder.name.reason = VALIDATORS.FOLDER_NAME(draft.modals.add_folder.name.value)
                                }).then(() => {
                                    if (this.state.modals.add_folder.name.reason === "") {
                                        const path = this.props.library_versions_api.state.path
                                        this.props.library_versions_api.create_child_folder(
                                            path.length > 0 ? path[path.length-1] : this.props.library_versions_api.state.current_version,
                                            this.state.modals.add_folder.name.value
                                        )
                                        .then(this.props.library_versions_api.refresh_library_versions)
                                        .then(this.close_modals)
                                    }
                                })
                            }}
                            color="primary"
                        >
                            Add
                        </Button>
                    )]}
                    open={this.state.modals.add_folder.is_open}
                >
                    <TextField
                        label={"Folder Name"}
                        fullWidth
                        error={this.state.modals.add_folder.name.reason !== ""}
                        helperText={this.state.modals.add_folder.name.reason}
                        value={this.state.modals.add_folder.name.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.add_folder.name.value = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={`Delete Folder ${this.state.modals.delete_folder.to_delete.folder_name}`}
                    open={this.state.modals.delete_folder.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                this.update_state(draft => {
                                    draft.modals.delete_folder.name.reason = VALIDATORS.DELETE_IF_EQUALS(
                                        draft.modals.delete_folder.name.value, this.state.modals.delete_folder.to_delete.folder_name
                                    )
                                }).then(() => {
                                    if (this.state.modals.delete_folder.name.reason === "") {
                                        this.props.library_versions_api.delete_folder(
                                            this.state.modals.delete_folder.to_delete
                                        ).then(this.close_modals)
                                    }
                                })
                            }}
                            color="secondary"
                        >
                            Delete
                        </Button>
                    ), (
                        <Button
                            key={2}
                            onClick={this.close_modals}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Typography>This action is irreversible. Please enter {this.state.modals.delete_folder.to_delete.folder_name} to confirm deletion</Typography>
                    <TextField
                        label={"Folder Name"}
                        fullWidth
                        error={this.state.modals.delete_folder.name.reason !== ""}
                        helperText={this.state.modals.delete_folder.name.reason}
                        value={this.state.modals.delete_folder.name.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.delete_folder.name.value = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={`Rename Folder ${this.state.modals.rename_folder.to_rename.folder_name}`}
                    open={this.state.modals.rename_folder.is_open}
                    actions={[(
                        <Button
                            key={2}
                            onClick={this.close_modals}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={()=> {
                                this.update_state(draft => {
                                    draft.modals.rename_folder.name.reason = VALIDATORS.FOLDER_NAME(
                                        draft.modals.rename_folder.name.value
                                    )
                                }).then(() => {
                                    if (this.state.modals.rename_folder.name.reason === "") {
                                        this.props.library_versions_api.rename_folder(
                                            this.state.modals.rename_folder.to_rename, this.state.modals.rename_folder.name.value
                                        ).then(this.close_modals)
                                    }
                                })
                            }}
                            color="secondary"
                        >
                            Rename
                        </Button>
                    )]}
                >
                    <TextField
                        label={"New Folder Name"}
                        fullWidth
                        error={this.state.modals.rename_folder.name.reason !== ""}
                        helperText={this.state.modals.rename_folder.name.reason}
                        value={this.state.modals.rename_folder.name.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.rename_folder.name.value = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={`Move Contents ${this.state.selected_files.map(content => content.file_name).join(", ")}`}
                    open={this.state.modals.move_content.is_open}
                    actions={[(
                        <Button
                            key={2}
                            onClick={this.close_modals}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={()=> {
                                const path = this.props.library_versions_api.state.path
                                this.props.library_versions_api.add_content_to_folder(
                                    this.state.modals.move_content.destination_folder[0],
                                    this.state.selected_files
                                ).then(() => this.props.library_versions_api.remove_content_from_folder(
                                    path[path.length - 1],
                                    this.state.selected_files
                                )).then(this.close_modals)
                            }}
                            color="secondary"
                        >
                            Move
                        </Button>
                    )]}
                >
                    <Autocomplete
                        value={this.state.modals.move_content.destination_folder}
                        onChange={(_evt:any, value: [LibraryFolder, string] | null) => {
                            if (value !== null) {
                                this.update_state(draft => {
                                    draft.modals.move_content.destination_folder = value
                                })
                            }
                        }}
                        filterOptions={(options: any, params: any) => {
                            return this.auto_complete_filter(options, params)
                        }}
                        handleHomeEndKeys   
                        options={this.props.library_versions_api.state.folders_in_version}
                        getOptionLabel={option => option[1]}
                        renderInput={params => (
                            <TextField
                                {...params}
                                variant={"standard"}
                                placeholder={"Destination"}
                            />
                        )}
                    />
                </ActionDialog>
            </>
        )
    }
}
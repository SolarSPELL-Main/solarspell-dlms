import React, { Component } from 'react';


import { APP_URLS } from './urls';
import { cloneDeep } from 'lodash';
import ActionDialog from './reusable/action_dialog';
import { Button, Typography } from '@material-ui/core';
import Axios from 'axios';
import VALIDATORS from './validators';
import { update_state } from './utils';
import ContentModal from './reusable/content_modal';

import { MetadataAPI, SerializedContent, ContentsAPI } from './types';
import { ViewContentModal } from './reusable/view_content_modal';
import ContentSearch from './reusable/content_search';
import BulkContentModal from "./reusable/bulk_content_modal";


interface ContentProps {
    metadata_api: MetadataAPI
    contents_api: ContentsAPI
    show_toast_message: (message: string, is_success: boolean) => void
    close_toast: () => void
    show_loader: () => void
    remove_loader: () => void
}

interface ContentState {
    modals: ContentModals
}

interface ContentModals {
    add: {
        is_open: boolean
    }
    view: {
        is_open: boolean
        row: SerializedContent
    }
    edit: {
        is_open: boolean
        row: SerializedContent
    }
    delete_content: {
        is_open: boolean
        row: SerializedContent
    }
    bulk_add: {
        is_open: boolean
    }
}

export default class Content extends Component<ContentProps, ContentState> {

    update_state: (update_func: (draft: ContentState) => void) => Promise<void>

    modal_defaults: ContentModals
    content_defaults: SerializedContent

    

    constructor(props: ContentProps) {
        super(props)

        this.update_state = update_state.bind(this)

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
            metadata: [],
            metadata_info: [],
            published_year: ""
        }

        this.modal_defaults = {
            add: {
                is_open: false
            },
            view: {
                is_open: false,
                row: this.content_defaults
            },
            edit: {
                is_open: false,
                row: this.content_defaults
            },
            delete_content: {
                is_open: false,
                row: this.content_defaults
            },
            bulk_add: {
                is_open: false,
            }
        }

        this.state = {
            modals: cloneDeep(this.modal_defaults)
        }

        this.close_modals = this.close_modals.bind(this)
        this.update_state = this.update_state.bind(this)
    }

    //Resets the state of a given modal. Use this to close the modal.
    close_modals() {
        this.update_state(draft => {
            draft.modals = cloneDeep(this.modal_defaults)
        })
    }

    render() {
        const {
            add,
            view,
            edit,
            delete_content,
            bulk_add
        } = this.state.modals
        const {
            metadata_api,
            contents_api
        } = this.props
        return (
            <React.Fragment>
                <Button
                    onClick={_ => {
                        this.update_state(draft => {
                            draft.modals.add.is_open = true
                        })
                    }}
                    style={{
                        marginLeft: "1em",
                        marginBottom: "1em",
                        backgroundColor: "#75b2dd",
                        color: "#FFFFFF"
                    }}
                >New Content</Button>
                <ContentSearch
                    contents_api={contents_api}
                    metadata_api={metadata_api}
                    on_delete={row => {
                        this.update_state(draft => {
                            draft.modals.delete_content.is_open = true
                            draft.modals.delete_content.row = row
                        })
                    }}
                    on_edit={row => {
                        this.update_state(draft => {
                            draft.modals.edit.is_open = true
                            draft.modals.edit.row = row
                        })
                    }}
                    on_view={row => {
                        this.update_state(draft => {
                            draft.modals.view.is_open = true
                            draft.modals.view.row = row
                        })
                    }}
                    on_toggle_active={row => {
                        Axios.patch(APP_URLS.CONTENT_ITEM(row.id), {
                            active: !row.active
                        })
                    }}
                />
                >New Content
                </Button>
                <Button
                    onClick={_ => {
                        this.update_state(draft => {
                            draft.modals.bulk_add.is_open = true
                        })
                    }}
                    style={{
                        marginLeft: "1em",
                        marginBottom: "1em",
                        backgroundColor: "#75b2dd",
                        color: "#FFFFFF"
                    }}
                >Add Bulk Content
                </Button>
                <ExpansionPanel expanded={this.state.search.is_open} onChange={(_:any, expanded: boolean) => {
                    this.update_state(draft => {
                        draft.search.is_open = expanded
                    })
                }}>
                    <ExpansionPanelSummary>
                        <Typography variant={"h6"}>Search</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Title"}
                                    value={search.title}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.title = evt.target.value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Filename"}
                                    value={search.filename}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.filename = evt.target.value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Copyright"}
                                    value={search.copyright}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.copyright = evt.target.value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Years From"}
                                    value={search.years_from}
                                    InputProps={{inputProps: {min: 0, max: 2100}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.years_from = isNaN(parsed) ? null : parsed
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Years To"}
                                    value={search.years_to}
                                    InputProps={{inputProps: {min: 0, max: 2100}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.years_to = isNaN(parsed) ? null : parsed
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize From"}
                                    value={search.file_size_from}
                                    InputProps={{inputProps: {min: 0, max: 1000000000000}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.file_size_from = isNaN(parsed) ? null : parsed
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize To"}
                                    value={search.file_size_to}
                                    InputProps={{inputProps: {min: 0, max: 1000000000000}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.file_size_to = isNaN(parsed) ? null : parsed
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <KeyboardDatePicker
                                    variant={"inline"}
                                    format={"MM/dd/yyyy"}
                                    value={search.reviewed_from}
                                    label={"Reviewed From"}
                                    onChange={value => {
                                        contents_api.update_search_state(draft => {
                                            draft.reviewed_from = value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <KeyboardDatePicker
                                    variant={"inline"}
                                    format={"MM/dd/yyyy"}
                                    value={search.reviewed_to}
                                    label={"Reviewed To"}
                                    onChange={value => {
                                        contents_api.update_search_state(draft => {
                                            draft.reviewed_to = value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Container disableGutters style={{display: "flex", height: "100%"}}>
                                    <Select
                                        style={{alignSelf: "bottom"}}
                                        label={"Active"}
                                        value={search.active}
                                        onChange={(event) => {
                                            contents_api.update_search_state(draft => {
                                                draft.active = event.target.value as active_search_option
                                            }).then(this.reload_rows)
                                        }}
                                    >
                                        <MenuItem value={"all"}>All</MenuItem>
                                        <MenuItem value={"active"}>Active</MenuItem>
                                        <MenuItem value={"inactive"}>Inactive</MenuItem>
                                    </Select>
                                </Container>
                            </Grid>
                            {Object.entries(metadata_api.state.metadata_by_type).map((entry: [string, SerializedMetadata[]], idx) => {
                                const [metadata_type, metadata] = entry
                                return (
                                    <Grid item xs={4} key={idx}>
                                        <Autocomplete
                                            multiple
                                            options={metadata}
                                            getOptionLabel={option => option.name}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant={"standard"}
                                                    label={metadata_type}
                                                    placeholder={metadata_type}
                                                />
                                            )}
                                            onChange={(_evt, values) => {
                                                contents_api.update_search_state(draft => {
                                                    draft.metadata[metadata_type] = values
                                                }).then(this.reload_rows)
                                            }}
                                        />
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <br />
                <DataGrid
                    columns={this.columns}
                    rows={contents_api.state.display_rows}
                >
                    <SortingState
                        sorting={this.state.sorting}
                        onSortingChange={(sorting) => {
                            this.update_state(draft => {
                                draft.sorting = sorting
                            }).then(this.reload_rows)
                        }}
                        columnExtensions={this.columns.map(column => {
                            return {
                                columnName: column.name,
                                sortingEnabled: ["file_name", "title", "description"].includes(column.name)
                            }
                        })}
                    />
                    <PagingState
                        currentPage={this.state.current_page}
                        onCurrentPageChange={(current_page: number) => {
                            this.update_state(draft => {
                                draft.current_page = current_page
                            }).then(this.reload_rows)
                        }}
                        pageSize={this.state.page_size}
                        onPageSizeChange={(page_size: number) => {
                            this.update_state(draft => {
                                draft.page_size = page_size
                            }).then(this.reload_rows)
                        }}
                    />
                    <CustomPaging totalCount={this.state.total_count}/>
                    <Table />
                    <TableHeaderRow showSortingControls />
                    <PagingPanel pageSizes={this.page_sizes} />
                </DataGrid>
                <ActionDialog
                    title={`Delete Content item ${delete_content.row.title}?`}
                    open={delete_content.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                Axios.delete(APP_URLS.CONTENT_ITEM(delete_content.row.id))
                                this.close_modals()
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
                    <Typography>This action is irreversible</Typography>
                </ActionDialog>
                <ContentModal
                    is_open={add.is_open}
                    on_close={() => {
                        this.update_state(draft => {
                            draft.modals.add.is_open = false
                        })
                    }}
                    metadata_api={metadata_api}
                    modal_type={"add"}
                    validators={{
                        content_file: VALIDATORS.ADD_FILE,
                        title: VALIDATORS.TITLE,
                        description: VALIDATORS.DESCRIPTION,
                        year: VALIDATORS.YEAR,
                        reviewed_on: VALIDATORS.REVIEWED_ON,
                        metadata: VALIDATORS.METADATA,
                        copyright: VALIDATORS.COPYRIGHT,
                        rights_statement: VALIDATORS.RIGHTS_STATEMENT
                    }}
                    show_toast_message={this.props.show_toast_message}
                    show_loader={this.props.show_loader}
                    remove_loader={this.props.remove_loader}
                />
                <ContentModal
                    is_open={edit.is_open}
                    on_close={() => {
                        this.update_state(draft => {
                            draft.modals.edit.is_open = false
                        })
                    }}
                    metadata_api={metadata_api}
                    modal_type={"edit"}
                    row={edit.row}
                    validators={{
                        content_file: VALIDATORS.EDIT_FILE,
                        title: VALIDATORS.TITLE,
                        description: VALIDATORS.DESCRIPTION,
                        year: VALIDATORS.YEAR,
                        reviewed_on: VALIDATORS.REVIEWED_ON,
                        metadata: VALIDATORS.METADATA,
                        copyright: VALIDATORS.COPYRIGHT,
                        rights_statement: VALIDATORS.RIGHTS_STATEMENT
                    }}
                    show_toast_message={this.props.show_toast_message}
                    show_loader={this.props.show_loader}
                    remove_loader={this.props.remove_loader}
                />
                <ViewContentModal
                    is_open={view.is_open}
                    metadata_api={metadata_api}
                    on_close={this.close_modals}
                    row={view.row}
                />
                <BulkContentModal
                    is_open={bulk_add.is_open}
                    on_close={() => {
                        this.update_state(draft => {
                            draft.modals.bulk_add.is_open = false
                        })
                    }}
                    show_toast_message={this.props.show_toast_message}
                    show_loader={this.props.show_loader}
                    remove_loader={this.props.remove_loader}>
               </BulkContentModal>
            </React.Fragment>
        )
    }
}
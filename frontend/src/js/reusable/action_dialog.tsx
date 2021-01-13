import { DialogActions, DialogContent, Dialog, DialogTitle } from "@material-ui/core"
import React, { useEffect, useRef, useState } from 'react'

interface ActionDialogProps {
    title: string,
    open: boolean,
    get_actions: (focus_ref: React.RefObject<HTMLButtonElement>) => JSX.Element[],
    on_close?: () => void
}

const ActionDialog: React.FunctionComponent<ActionDialogProps> = (props) => {
    const focus_ref = useRef<HTMLButtonElement>(null)
    const [actions] = useState(props.get_actions(focus_ref))

    useEffect(() => {
        if (props.open) {
            focus_ref.current?.focus()
        }
    }, [props.open])
    
    return (
        <Dialog
            open={props.open}
            onClose={props.on_close || (() => {})}
            maxWidth={false}
        >
            <DialogTitle>
                {props.title}
            </DialogTitle>
            <DialogContent>
                {props.children}
            </DialogContent>
            <DialogActions>
                {actions}
            </DialogActions>
        </Dialog>
    )
}

export default ActionDialog
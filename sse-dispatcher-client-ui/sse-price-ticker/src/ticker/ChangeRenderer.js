// ChangeRenderer.js
import React from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
    icon: {
        verticalAlign: 'middle',
    },
}));

const ChangeRenderer = (props) => {
    const classes = useStyles();
    const change = props.value;
    return (
        <span>
            {change > 0 ? <ArrowUpwardIcon className={classes.icon} /> : <ArrowDownwardIcon className={classes.icon} />}
        </span>
    );
};

export default ChangeRenderer;
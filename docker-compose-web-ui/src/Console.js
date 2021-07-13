import { Paper } from "@material-ui/core";

export default function Console({ lines = [] }) {

    const println = (line) => (
        <p style={{margin: 0, marginBottom: 2}}>{ line }</p>
    )

    const Background = () => ( 
        <div style={{
            background: '#393939',
            color: '#ccc',
            fontFamily: 'monospace',
            padding: 10,
            borderRadius: 5,
            maxHeight: 200,
            overflowY: "scroll"

        }}>
            {(lines.length ? lines : ['$']).map(println)}
        </div>
     )

    return (
        <Paper style={{ padding: 10 }}>
            <Background />

        </Paper>
    );
}
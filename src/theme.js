import { createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  typography: { useNextVariants: true },
  palette: {
    primary: {
      light: '#59B7E7',
      main: '#31ADE3',
      dark: '#014263',
      contrastText: '#FFF',
    },
  },
  overrides: {},
});

export default theme;

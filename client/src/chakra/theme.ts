import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { mode} from "@chakra-ui/theme-tools";

const config: ThemeConfig = {
    initialColorMode: "dark",
    useSystemColorMode: true,
};

// 3. extend the theme
const theme = extendTheme({
    config,
    styles: {
        global: (props: any) => ({
            body: {
                // backgroundColor: mode("gray.500", "")(props),
                backgroundColor: mode("", "")(props),
                // Custom styles for the toast container
                "#chakra-toast-manager-bottom-left": {
                    bottom: "30px !important", // Adjust bottom to create margin effect
                    left: "30px !important", // Adjust left for horizontal position
                },
            },
        }),
    },
});

export default theme;

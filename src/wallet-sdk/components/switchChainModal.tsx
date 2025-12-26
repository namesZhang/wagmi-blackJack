'use client'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { useWallet } from '../privader';

export interface SimpleDialogProps {
  open: boolean;
  chainId: number;
  onClose: (value: number) => void;
  onChangeChain: (value: number) => Promise<void>;
}

const SwitchChainModal = (props: SimpleDialogProps) => {
  const { onClose, chainId, open, onChangeChain } = props;
  const { chains } = useWallet()

  const handleClose = () => {
    onClose(chainId);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>switch chain</DialogTitle>
      <List sx={{ pt: 0 }}>
        {chains.map((chain: any) => (
          <ListItem disablePadding key={chain.id}>
            <ListItemButton onClick={() => onChangeChain(chain.id)}>
              <ListItemText primary={`chainName:${chain.name} | chainId:${chain.id}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}

export default SwitchChainModal

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  RadioGroup,
  Radio,
  Box,
  Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';

interface LocationSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (location: 'Home' | 'Office') => void;
  isLoading?: boolean;
}

export const LocationSelectionDialog = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: LocationSelectionDialogProps) => {
  const [selectedLocation, setSelectedLocation] = useState<'Home' | 'Office'>('Office');

  const handleConfirm = () => {
    onConfirm(selectedLocation);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 1,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={600}>
          Select Work Location
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Where are you working from today?
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value as 'Home' | 'Office')}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                mt: 1,
              }}
            >
              <Box
                sx={{
                  border: '2px solid',
                  borderColor: selectedLocation === 'Office' ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: selectedLocation === 'Office' ? 'primary.50' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50',
                  },
                }}
                onClick={() => setSelectedLocation('Office')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BusinessIcon 
                    sx={{ 
                      fontSize: 32, 
                      color: selectedLocation === 'Office' ? 'primary.main' : 'grey.500' 
                    }} 
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Office
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Working from office location
                    </Typography>
                  </Box>
                  <Radio
                    checked={selectedLocation === 'Office'}
                    value="Office"
                    sx={{ ml: 'auto' }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  border: '2px solid',
                  borderColor: selectedLocation === 'Home' ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: selectedLocation === 'Home' ? 'primary.50' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50',
                  },
                }}
                onClick={() => setSelectedLocation('Home')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HomeIcon 
                    sx={{ 
                      fontSize: 32, 
                      color: selectedLocation === 'Home' ? 'primary.main' : 'grey.500' 
                    }} 
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Home
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Working from home
                    </Typography>
                  </Box>
                  <Radio
                    checked={selectedLocation === 'Home'}
                    value="Home"
                    sx={{ ml: 'auto' }}
                  />
                </Box>
              </Box>
            </Box>
          </RadioGroup>
        </FormControl>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={isLoading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          {isLoading ? 'Clocking In...' : 'Clock In'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

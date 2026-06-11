import glob
import pandas as pd

# Point to your extracted folder
all_files = glob.glob(r"D:\NIDS\data\raw\CICIDS2017\*.csv")

dfs = []
for f in all_files:
    df = pd.read_csv(f, low_memory=False)
    dfs.append(df)

combined = pd.concat(dfs, ignore_index=True)

# Clean common issues in CICIDS 2017
combined.columns = combined.columns.str.strip()          # remove whitespace from col names
combined.replace([float('inf'), float('-inf')], pd.NA, inplace=True)
combined.dropna(inplace=True)

print(combined['Label'].value_counts())
print(combined.shape)   # should be ~2.8M rows, 79 cols